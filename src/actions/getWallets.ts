"use server";

import { getUserByEmail } from "@/data/user";
import { User, getUserWallets } from "@/data/wallet";

export const getWallets = async (userRef: any) => {
  console.log("userRef @ 7", userRef);
  const user: User | any = await getUserByEmail(userRef.current.email);
  if (!user) {
    return null;
  }
  const wallets = await getUserWallets(user);

  // console.log("wallets", wallets);

  return wallets;
};
