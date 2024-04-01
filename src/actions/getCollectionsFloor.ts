import axios from 'axios';

async function getCollectionsFloor(collectionIds: string[]) {
  const currentTime = Math.floor(Date.now() / 1000);
  const oneHourBefore = currentTime - 3600;

  const currentDate = new Date();
  const sevenDaysBefore = new Date();
  sevenDaysBefore.setDate(currentDate.getDate() - 7);

  const fetchPromises = collectionIds.map(async (collectionId) => {
    const hourlyApiUrl = `https://api.simplehash.com/api/v0/nfts/floor_prices_v2/collection/${collectionId}/hourly?marketplace_ids=magiceden&from_timestamp=${oneHourBefore}&to_timestamp=${currentTime}`;
    const dailyApiUrl = `https://api.simplehash.com/api/v0/nfts/floor_prices_v2/collection/${collectionId}/daily?start_date=${sevenDaysBefore.toISOString().split("T")[0]
      }&end_date=${currentDate.toISOString().split("T")[0]
      }&marketplace_ids=magiceden`;

    try {
      const hourlyResponse = await axios.get(hourlyApiUrl, {
        headers: {
          "x-api-key": process.env.SIMPLE_HASH ?? "",
        },
      });
      const dailyResponse = await axios.get(dailyApiUrl, {
        headers: {
          "x-api-key": process.env.SIMPLE_HASH ?? "",
        },
      });

      const hourlyData = hourlyResponse.data;
      const dailyData = dailyResponse.data;

      const currentFloorPrice = hourlyData.floor_prices[0]?.floor_price ?? null;
      const oneDayAgoFloorPrice =
        dailyData.floor_prices[1]?.floor_price ?? null;
      const sevenDaysAgoFloorPrice =
        dailyData.floor_prices[7]?.floor_price ?? null;

      const oneDFloor =
        oneDayAgoFloorPrice !== 0
          ? (
            ((currentFloorPrice - oneDayAgoFloorPrice) /
              oneDayAgoFloorPrice) *
            100
          ).toFixed(2) + "%"
          : "N/A";

      const sevenDFloor =
        sevenDaysAgoFloorPrice !== 0
          ? (
            ((currentFloorPrice - sevenDaysAgoFloorPrice) /
              sevenDaysAgoFloorPrice) *
            100
          ).toFixed(2) + "%"
          : "N/A";

      return {
        collection_id: collectionId,
        floor_price: currentFloorPrice,
        One_D_floor: oneDFloor,
        Seven_D_floor: sevenDFloor,
      };
    } catch (error) {
      console.error(
        `Error fetching data for collection ID ${collectionId}:`,
        error
      );
      return [];
    }
  });

  try {
    const floorPrices = await Promise.all(fetchPromises);
    if (floorPrices.length === 0) {
      throw new Error("No floor prices found");
    }
    // console.log("floorPrices", floorPrices);
    return floorPrices;
  } catch (error) {
    console.error("Error fetching floor prices:", error);
    return [];
  }
}

export default getCollectionsFloor;