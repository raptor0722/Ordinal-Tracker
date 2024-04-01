import * as React from "react";
import { styled } from "@mui/material/styles";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { Container } from "@mui/material";
import { validate, Network } from "bitcoin-address-validation";
import { useCurrentUser } from "@/hooks/current-user";
import { deleteWallet } from "@/actions/deleteWallet";
export interface ChipData {
  key: number;
  label: string;
}

const ListItem = styled("li")(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

function Wallets({
  wallets,
  setWallets,
  fetchData,
  setFetchData,
  isLoading,
  setIsLoading,
}: {
  wallets: ChipData[];
  setWallets: React.Dispatch<React.SetStateAction<ChipData[]>>;
  fetchData: boolean;
  setFetchData: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const user: any = useCurrentUser();
  let userRef: any = React.useRef(user);

  console.log("user", user);
  console.log("userRef @ 38", userRef);

  const handleDelete = (chipToDelete: ChipData) => async () => {
    if (userRef.current !== undefined) {
      //session exists
      const result = await deleteWallet(userRef.current, chipToDelete.label);
      setIsLoading(true);
      if (result.error) {
        if (result.error == "Wallet does not exist") {
          setWallets((chips) =>
            chips.filter((chip) => chip.key !== chipToDelete.key)
          );
          return;
        }
        alert(result.error);
        return;
      }
      setWallets((chips) =>
        chips.filter((chip) => chip.key !== chipToDelete.key)
      );
      setFetchData(!fetchData);
      return;
    }
    setWallets((chips) =>
      chips.filter((chip) => chip.key !== chipToDelete.key)
    );
    localStorage.removeItem("dashboardData");
    setFetchData(!fetchData);
  };

  const HandleAddWallet = async (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      const wallet = (event.target as HTMLInputElement).value;

      if (wallet === "") {
        return;
      }

      if (wallets.find((chip) => chip.label === wallet)) {
        (event.target as HTMLInputElement).value = "";
        return;
      }

      if (!validate(wallet, Network.mainnet)) {
        (event.target as HTMLInputElement).value = "";
        return;
      }

      console.log("userRef in wallets useEffect", userRef);

      setWallets((chips) => [...chips, { key: chips.length, label: wallet }]);
      (event.target as HTMLInputElement).value = "";
      setIsLoading(true);
      localStorage.removeItem("dashboardData");
      setFetchData(!fetchData);
    }
  };

  function formatLabel(label: string): string {
    if (label.length === 0) return label;
    const firstFour = label.substring(0, 4);
    const lastFour = label.substring(label.length - 4);
    const middleDots = "....";
    return `${firstFour}${middleDots}${lastFour}`;
  }

  return (
    <Paper
      sx={{
        display: "flex",
        flexWrap: "wrap",
        listStyle: "none",
        p: 0,
        m: 0,
        backgroundColor: "#000000",
      }}
      component="ul"
    >
      <Container
        sx={{
          display: "flex",
          backgroundColor: "#000000",
          padding: "10px",
          margin: "0px",
          minWidth: "100%",
          height: "100%",
          boxShadow: "0px 0px 2px 0px #c5c2f1",
        }}
      >
        <TextField
          id="filled-basic"
          label="Add Wallet"
          variant="standard"
          onKeyDown={HandleAddWallet}
          style={{
            borderRadius: "50px",
            margin: "0px",
          }}
        />
        {wallets.length > 0 &&
          wallets.map((data) => {
            let icon;

            return (
              <ListItem
                key={data.key}
                sx={{
                  backgroundColor: "#000000",
                }}
              >
                <Chip
                  icon={icon}
                  label={formatLabel(data.label)}
                  onDelete={handleDelete(data)}
                  sx={{
                    fontWeight: 700,
                    width: "100%",
                    height: "100%",
                    padding: "5px",
                    textDecorationColor: "#4a40c9",
                    textShadow: "0 0 2px #2a67a2",
                    backgroundColor: "#000000",
                    fontSize: "1.4rem",
                  }}
                />
              </ListItem>
            );
          })}
      </Container>
    </Paper>
  );
}

export default Wallets;
