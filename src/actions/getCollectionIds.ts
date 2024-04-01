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
  let apikey: string = process.env.SIMPLE_HASH ?? "";
  let collectionDetails: CollectionDetails[] = [];

  const fetchData = async (wallet: string) => {
    const headers = new Headers();
    headers.append("x-api-key", apikey);

    const response = await fetch(
      `https://api.simplehash.com/api/v0/nfts/collections_by_wallets_v2?chains=bitcoin&wallet_addresses=${wallet}`,
      {
        method: "GET",
        headers: headers,
      }
    );

    if (response.status === 200) {
      const jsonData = await response.json();

      const ids = jsonData.collections
        .map((collection: any) => collection.collection_id)
        .filter((id: string | null) => id !== null);

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
