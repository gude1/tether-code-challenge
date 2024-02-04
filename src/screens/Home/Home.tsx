import { Button, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useRef } from "react";
import { RootStackParamList } from "../../navigation/RootStackNavigator";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BookQueryResponse } from "../../types";
import { useAppDispatch, useAppSelector } from "../../redux/hooks/hook";
import { addBook } from "../../redux/slice/BookListSlice";
type HomeScreenProps = NativeStackScreenProps<RootStackParamList, "Home">;

interface TableProps {
  data: string[][];
}

const Table: React.FC<TableProps> = ({ data }) => {
  return (
    <View style={styles.container}>
      {data.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell, cellIndex) => (
            <View key={cellIndex} style={styles.cell}>
              <Text>{cell}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const Home = ({ navigation }: HomeScreenProps) => {
  const ws = useRef<WebSocket | null>(null);
  const dispatch = useAppDispatch();
  const books = useAppSelector((state) => state.books);
  console.log("books-----------------------", books);
  const connectWebSocket = () => {
    ws.current = new WebSocket("wss://api-pub.bitfinex.com/ws/2");
    let msg = JSON.stringify({
      event: "subscribe",
      channel: "book",
      symbol: "tBTCUSD",
    });

    ws.current.onopen = () => {
      ws.current?.send(msg);
    };
    ws.current.onmessage = (event) => {
      console.log("WebSocket message:", event.data);
      let res = JSON.parse(event.data) as BookQueryResponse; // JSON PARSE THE DATA

      //add to store
      dispatch(addBook(res));
    };

    ws.current.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
      // Attempt to reconnect when closed
      // setTimeout(connectWebSocket, 3000);
    };
    ws.current.onerror = (event) => {
      console.error("WebSocket error:", JSON.stringify(event));
    };
  };

  const disconnectWebSocket = () => {
    if (ws.current) {
      ws.current.close();
    }
  };

  useEffect(() => {
    const handleConnectivityChange = (state: NetInfoState) => {
      if (state.isConnected) {
        // Reconnect when network connectivity is back
        setTimeout(connectWebSocket, 500);
      } else {
        // Close WebSocket when network is disconnected
        disconnectWebSocket();
      }
    };

    const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);

    return () => {
      disconnectWebSocket();
      unsubscribe();
    };
  }, []);

  const renderBookList = () => {
    if (!books) {
      return null;
    }

    // Assuming 'state' is an instance of BookListState
    const mySetKeys = Object.keys(books.mySet);
    let tablearr = [["Price", "Amount"]];
    mySetKeys.forEach((key) => {
      const value = books.mySet[key];
      tablearr.push();
    });
    return <Table data={tablearr} />;
  };

  return (
    <View>
      <View>
        <Button title="Connect" onPress={connectWebSocket} />

        <Button title="Disconnect" onPress={disconnectWebSocket} />
      </View>
      {renderBookList()}
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cell: {
    flex: 1,
    borderWidth: 1,
    borderColor: "black",
    padding: 10,
    alignItems: "center",
  },
});