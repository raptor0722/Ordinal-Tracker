"use server";

import {
  addCollectionsToCollection,
  deleteWatchlistCollection,
  getCollectionById,
  getWatchlistCollections,
  isInCollection,
  isWatchlistCollection,
} from "@/data/collection";
import { db } from "@/lib/db";
import getCollectionsStats from "./getCollectionsStats";
import getCollectionsFloor from "./getCollectionsFloor";

interface data {
  watchlists?: {
    collectionId: string;
    description: string;
    image: string;
    name: string;
  }[];
  error?: string;
}

export const getWatchlists = async (userRef: any): Promise<data> => {
  try {
    const user = await db.user.findUnique({
      where: {
        email: userRef.current.email,
      },
    });

    if (!user) {
      return { error: "Please login to view your watchlist" };
    }

    // console.log("inside getWatchlists", user);

    const collectionsInWatchlist = await getWatchlistCollections(user);

    const watchlists: any = await Promise.all(
      collectionsInWatchlist.map(async (collection) => {
        const collectionDetails = await getCollectionById(
          collection.collectionId
        );
        const stats: any[] = await getCollectionsStats([collection.collectionId]);
        const floor: any[] = await getCollectionsFloor([collection.collectionId]);
        return {
          name: collectionDetails?.name,
          image: collectionDetails?.image,
          collection_id: collection.collectionId,
          description: collectionDetails?.description,
          owner_count: collectionDetails?.owner_count,
          nft_count: collectionDetails?.nft_count,
          quantity: collectionDetails?.quantity,
          volume_1d: stats[0].volume_1d,
          volume_7d: stats[0].volume_7d,
          volume_30d: stats[0].volume_30d,
          market_cap: stats[0].market_cap,
          floor_price: floor[0].floor_price,
          One_D_floor: floor[0].One_D_floor,
          Seven_D_floor: floor[0].Seven_D_floor,
        };
      })
    );

    console.log("watchlists in server action", watchlists);
    return {
      watchlists,
    };
  } catch (error: any) {
    console.error("Error in getWatchlists:", error);
    return { error: error };
  }
};

import axios from 'axios';

export const addWatchListBySlug = async (slug: string, userRef: any) => {
  try {
    console.log("userRef in addWatchListBySlug", userRef);
    const user: any = await db.user.findUnique({
      where: {
        email: userRef.current.email,
      },
    });
    console.log("user from db", user);
    if (!user) {
      return { error: "Please login to add a collection to your watchlist" };
    }

    const formatSlug = (slug: string) => {
      let normalized = slug.toLowerCase();
      normalized = normalized.replace(/\s+/g, "");
      return normalized;
    };

    const formatSlugAgain = (slug: string) => {
      let normalized = slug.toLowerCase();
      normalized = normalized.replace(/\s+/g, "_");
      return normalized;
    };

    //format slug
    let formattedSlug: string = formatSlug(slug);
    console.log("formattedSlug", formattedSlug);

    //get inscription
    let inscription = await axios.get(`https://turbo.ordinalswallet.com/collection/${formattedSlug}`);

    //verify response
    if (inscription.status !== 200) {
      // If the first attempt fails, try again with the second formatted slug
      formattedSlug = formatSlugAgain(slug);
      console.log("formattedSlug", formattedSlug);

      inscription = await axios.get(`https://turbo.ordinalswallet.com/collection/${formattedSlug}`);

      // If the second attempt also fails, return an error
      if (inscription.status !== 200) {
        return { error: "Failed to fetch data from API, Try Again Later" };
      }
    }

    const inscriptionData = inscription.data;

    if (!inscriptionData) {
      return { error: "Collection not found" };
    }

    //get lowest inscription number
    const inscriptionNumber = inscriptionData.lowest_inscription_num + 5;
    console.log("inscription", inscriptionNumber);

    //get collection id
    const headers = {
      'x-api-key': process.env.SIMPLE_HASH ?? ""
    };

    const collectionIdFromSlug = await axios.get(`https://api.simplehash.com/api/v0/nfts/bitcoin/inscription_number/${inscriptionNumber}`, { headers });

    //verify response
    const response = collectionIdFromSlug.data;

    // console.log("response", response);
    if (response.status !== 200) {
      if (response.status === 404) {
        if (response.message === "Not Found") {
          return { error: "Collection not found" };
        }
        return { error: "Failed to fetch data from API, Try Again Later" };
      }
    }

    //check if it exists in collection, get details
    // console.log("response", response);
    const collectionId = response.collection.collection_id;
    // console.log("collectionId to get metadata for", collectionId);

    const isThereInCollection: any = await isInCollection(collectionId);

    if (isThereInCollection.error == "Collection not found") {
      //add to collection

      //get collection metadata details
      let collectionResponse: any = await axios.get(`https://api.simplehash.com/api/v0/nfts/collections/ids?collection_ids=${collectionId}`, { headers });

      collectionResponse = collectionResponse.data;

      // console.log("collectionResponse", collectionResponse);

      const parsedCollectionResponse = collectionResponse.collections.map((collection: any) => ({
        collection_id: collection.collection_id,
        name: collection.name,
        description: collection.description,
        image_url: collection.image_url,
        distinct_owner_count: collection.distinct_owner_count,
        distinct_nft_count: collection.distinct_nft_count,
        total_quantity: collection.total_quantity
      }));

      //Add to collections if does not exist
      await addCollectionsToCollection([collectionId], user, parsedCollectionResponse);
    }


    //get collection details
    const collectionDetails: any = await getCollectionById(collectionId);

    if (collectionDetails == null) {
      return { error: collectionDetails.error };
    }
    // console.log("collectionDetails", collectionDetails);

    // return;

    //check if it exists in user_watchlist, if not, add to watchlist
    const inwatchlist = await isWatchlistCollection(collectionId, user);

    // console.log("inwatchlist", inwatchlist);

    //return collection details
    const stats: any[] = await getCollectionsStats([collectionId]);
    const floor: any[] = await getCollectionsFloor([collectionId]);

    const result = {
      name: collectionDetails.name,
      image: collectionDetails.image,
      collection_id: collectionDetails.cId,
      description: collectionDetails.description,
      owner_count: collectionDetails.owner_count,
      nft_count: collectionDetails.nft_count,
      quantity: collectionDetails.quantity,
      volume_1d: stats[0].volume_1d,
      volume_7d: stats[0].volume_7d,
      volume_30d: stats[0].volume_30d,
      market_cap: stats[0].market_cap,
      floor_price: floor[0].floor_price,
      One_D_floor: floor[0].One_D_floor,
      Seven_D_floor: floor[0].Seven_D_floor,
    };

    console.log("result", result);

    return result;
  } catch (error: any) {
    console.error("Error in addWatchListBySlug:", error);
    return { error: error };
  }
};

export const getWatchlistsIds = async (userRef: any) => {
  try {
    const user: any = await db.user.findUnique({
      where: {
        email: userRef.current.email,
      },
    });

    if (!user) {
      return { error: "Please login to view your watchlist" };
    }

    // console.log("inside getWatchlistsIds", user);

    const collectionsInWatchlist = await getWatchlistCollections(user);

    const watchlists: any = collectionsInWatchlist.map((collection: any) => {
      return collection.collectionId;
    })

    return watchlists;
  } catch (error: any) {
    console.error("Error in getWatchlistsIds:", error);
    return { error: error };
  }
}

export const addWatchListById = async (collectionId: string, userRef: any) => {
  try {
    const user: any = await db.user.findUnique({
      where: {
        email: userRef.current.email,
      },
    });

    if (!user) {
      return { error: "Please login to add a collection to your watchlist" };
    }

    const isThereInCollection: any = await isInCollection(collectionId);

    console.log("isThereInCollection", isThereInCollection);

    const headers = {
      'x-api-key': process.env.SIMPLE_HASH ?? ""
    };

    if (isThereInCollection.error == "Collection not found") {
      //add to collection

      //get collection metadata details
      let collectionResponse: any = await axios.get(
        `https://api.simplehash.com/api/v0/nfts/collections/ids?collection_ids=${collectionId}`,
        { headers }
      );

      const [collectionsStats, collectionsFloor] = await Promise.all([
        getCollectionsStats([collectionId]),
        getCollectionsFloor([collectionId]),
      ]);

      console.log("collectionsStats", collectionsStats);
      console.log("collectionsFloor", collectionsFloor);
      console.log(collectionResponse.data);

      if (collectionsStats.length === 0 || collectionsFloor.length === 0) {
        return { error: "No data found" };
      }

      const collectionsStatsMap = collectionsStats.reduce(
        (map: any, collection: any) => {
          map[collection.collection_id] = collection;
          return map;
        },
        {}
      );

      collectionResponse = collectionResponse.data;

      const parsedCollectionResponse = collectionResponse.map((collection: any) => ({
        collection_id: collection.collection_id,
        name: collection.name,
        description: collection.description,
        image_url: collection.image_url,
        distinct_owner_count: collection.distinct_owner_count,
        distinct_nft_count: collection.distinct_nft_count,
        total_quantity: collection.total_quantity
      }));

      //Add to collections if does not exist
      const result: any = await addCollectionsToCollection([collectionId], user, parsedCollectionResponse);
      if (result.error) {
        return { error: result.error };
      }

      //isThereInUserWatchlist -> not -> add
      const inwatchlist: any = await isWatchlistCollection(collectionId, user);

      if (inwatchlist.error) {
        return { error: inwatchlist.error };
      }

      console.log("inwatchlist", inwatchlist);
      return;
      //return collection details
      // return [inwatchlist.collectionId];
    }


    //isThereInUserWatchlist -> not -> add
    const inwatchlist: any = await isWatchlistCollection(collectionId, user);

    if (inwatchlist.error) {
      return { error: inwatchlist.error };
    }

    // console.log("inwatchlist", inwatchlist);

    //return collection details
    return [inwatchlist.collectionId];
  } catch (error: any) {
    console.error("Error in addWatchListById:", error);
    return { error: error };
  }
}

export const deleteWatchlistById = async (collectionId: string, userRef: any) => {
  try {
    const user: any = await db.user.findUnique({
      where: {
        email: userRef.current.email,
      },
    });

    if (!user) {
      return { error: "Please login to remove a collection from your watchlist" };
    }

    await deleteWatchlistCollection(collectionId, user);

    return;

  } catch (error: any) {
    console.error("Error in deleteWatchlistById:", error);
    return { error: error };
  }
}