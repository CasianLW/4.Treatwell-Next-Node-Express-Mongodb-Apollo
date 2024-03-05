### query pour get all coiffeurs:

```graphql
query {
  coiffeurs {
    id
    nom
    prenom
    urlImage
    joursTravail {
      date
      slots
    }
  }
}
```

### query pour post coiffeur:

```graphql
mutation {
  addCoiffeur(
    nom: "Jane"
    prenom: "Doe"
    urlImage: "http://example.com/jane-doe.jpg"
    joursTravail: [
      {
        date: "2023-10-01"
        slots: [1, 2, 3, 4] # Assuming slots 1 to 4 (e.g., 8:00-9:00) are available on this day
      }
      {
        date: "2023-10-02"
        slots: [5, 6, 7, 8] # Assuming slots 5 to 8 (e.g., 9:00-10:00) are available on this day
      }
    ]
  ) {
    id
    nom
    prenom
    urlImage
    joursTravail {
      date
      slots {
        slotNumber
      }
    }
  }
}
```

### update coiffeur query:

65e608de23ac1de57491eab0

```graphql
mutation {
  updateCoiffeur(
    id: "coiffeurIdHere"
    nom: "Updated Name"
    prenom: "Updated Last Name"
    urlImage: "http://example.com/updated-image.jpg"
    joursTravail: [
      {
        date: "2023-10-03"
        slots: [9, 10, 11, 12] # Assuming 'slots' should be an array of integers
      }
    ]
  ) {
    id
    nom
    prenom
    urlImage
    joursTravail {
      date
      slots # No need for subfields if 'slots' is just an array of integers
    }
  }
}
```

### Mutation to Update Slots for an Existing Day

Here's how you would structure the GraphQL mutation to update slots for a specific day for a given coiffeur:

```graphql
mutation {
  updateSlots(
    coiffeurId: "65e6d1e34dc0185c4b8ff735"
    date: "2023-10-02"
    slots: [15, 16, 17, 18]
  ) {
    id
    nom
    prenom
    joursTravail {
      date
      slots
    }
  }
}
```

This mutation indicates that for the coiffeur with ID `65e6d1e34dc0185c4b8ff735`, you want to update the available slots for October 2, 2023, to `[15, 16, 17, 18]`.

### Mutation to Add a New Day with Slots

For adding a completely new day along with its available slots to a coiffeur's schedule, you would use a mutation structured like this:

```graphql
mutation {
  addDayWithSlots(
    coiffeurId: "65e6d1e34dc0185c4b8ff735"
    date: "2023-10-03"
    slots: [1, 2, 3, 4]
  ) {
    id
    nom
    prenom
    joursTravail {
      date
      slots
    }
  }
}
```

This mutation specifies that you want to add a new day, October 3, 2023, with slots `[1, 2, 3, 4]` available for booking, to the schedule of the coiffeur with ID `65e6d1e34dc0185c4b8ff735`.

### Get only one coiffeur

```graphql
query GetCoiffeur {
  coiffeur(id: "coiffeurIdHere") {
    id
    nom
    prenom
    urlImage
    joursTravail {
      date
      slots
    }
  }
}
```

## CLIENT SIDE SUBSCRIPTION USE CASE

### subscription on client side

```js
const COIFFEUR_UPDATED_SUBSCRIPTION = gql`
  subscription OnCoiffeurUpdated {
    coiffeurUpdated {
      coiffeurId
      updateType
      coiffeur {
        id
        nom
        prenom
        urlImage
        joursTravail {
          date
          slots
        }
      }
    }
  }
`;
```

// Use this subscription to listen for updates and handle them accordingly in your client app
