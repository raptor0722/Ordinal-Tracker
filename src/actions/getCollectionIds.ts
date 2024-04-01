interface CollectionDetails {
  collection_id: string;
  name: string;
  description: string;
  image_url: string;
  distinct_owner_count: number;
  distinct_nft_count: number;
  total_quantity: number;
}

async function getCollectionIds(wallets: string | null): Promise<
  | {
    collectionIds: Record<string, string[]>;
    collectionDetails: CollectionDetails[];
  }
  | undefined
> {
  let apikey: string = "djankoeth_sk_82e199b8-1068-4f03-88f3-ebea289332a2_6l5eq6wn5r0ny4ol";

  let collectionDetails: CollectionDetails[] = [];

  const fetchData = async (wallet: string) => {
    const headers = new Headers();
    headers.append("x-api-key", apikey);

    console.log("fetching data for wallet now using simple hash", wallet);

    const response = await fetch(
      `https://api.simplehash.com/api/v0/nfts/collections_by_wallets_v2?chains=bitcoin&wallet_addresses=${wallet}`,
      {
        method: "GET",
        headers: headers,
      }
    );

    console.log("the response has arrived", response);
    if (response.status === 200) {

      console.log("response is now 200!", response);
      const jsonData = await response.json();

      console.log("json data is now", jsonData);
      const ids = jsonData.collections
        .map((collection: any) => collection.collection_id)
        .filter((id: string | null) => id !== null);

      console.log("ids are now", ids);
      collectionDetails = [
        ...collectionDetails,
        ...jsonData.collections.map((collection: any) => ({
          collection_id: collection.collection_id,
          name: collection.collection_details.name,
          description: collection.collection_details.description,
          image_url: collection.collection_details.image_url,
          distinct_owner_count:
            collection.collection_details.distinct_owner_count,
          distinct_nft_count: collection.collection_details.distinct_nft_count,
          total_quantity: collection.collection_details.total_quantity,
        })),
      ];
      console.log("collection details are now", collectionDetails);
      return { [wallet]: ids };
    } else {
      throw new Error();
    }
  };

  try {
    if (wallets) {
      const walletIds = wallets.split(",");
      const walletCollections = await Promise.all(
        walletIds.map((wallet) => fetchData(wallet))
      );

      const result = Object.assign({}, ...walletCollections);

      // Remove duplicates and null values from collectionDetails
      collectionDetails = collectionDetails.filter(
        (collection, index, self) =>
          collection.collection_id !== null &&
          index ===
          self.findIndex((t) => t.collection_id === collection.collection_id)
      );
      return { collectionIds: result, collectionDetails: collectionDetails };
    }
  } catch (error) {
    console.error("Error fetching collection IDs:", error);
    throw error;
  }
}

export default getCollectionIds;
