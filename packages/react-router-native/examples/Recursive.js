import React from "react";
import { StyleSheet, Text, ScrollView } from "react-native";

import { NativeRouter, Route, Link } from "react-router-native";

const PEEPS = [
  { id: 0, name: "Michelle", friends: [1, 2, 3] },
  { id: 1, name: "Sean", friends: [0, 3] },
  { id: 2, name: "Kim", friends: [0, 1, 3] },
  { id: 3, name: "David", friends: [1, 2] }
];

const find = id => PEEPS.find(p => p.id === id);

function Person({ match }) {
  const person = find(parseInt(match.params.id, 10));

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>
        {person.name}
        ’s Friends
      </Text>
      {person.friends.map(id => (
        <Link
          key={id}
          to={`${match.url}/${id}`}
          style={styles.navItem}
          underlayColor="#f0f4f7"
        >
          <Text>{find(id).name}</Text>
        </Link>
      ))}
      <Route path={`${match.url}/:id`} component={Person} />
    </ScrollView>
  );
}

function App() {
  return (
    <NativeRouter>
      <Person match={{ params: { id: 0 }, url: "" }} />
    </NativeRouter>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    padding: 10
  },
  header: {
    fontSize: 20
  }
});

export default App;
