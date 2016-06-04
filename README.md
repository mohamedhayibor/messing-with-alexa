
Potential extra features:



# current set up for now

### Intent Schema
```json
{
  "intents": [
    {
      "intent": "GetStationsIntent",
      "slots": [
        {
          "name": "Stations",
          "type": "LIST_OF_STATIONS"
        }
      ]
    },
    {
      "intent": "WhatStation"
    },
    {
      "intent": "AMAZON.HelpIntent"
    }
  ]
}

```

### Custom Slot Types

> See listOfStations

### Sample Utterances:
```
WhatStation what station is available
WhatStation what is my favorite station
WhatStation what's my station
WhatStation what is my station
WhatStation my station
WhatStation my favorite station
WhatStation get my station
WhatStation get my favorite station
WhatStation give me my favorite station
WhatStation give me my station
WhatStation what my station is
WhatStation what my favorite station is
WhatStation yes
WhatStation yup
WhatStation sure
WhatStation yes please
WhatStation my favorite color is {Station}
```

# To mess with later

1. To get the user's address:

[https://github.com/un33k/node-ipware/issues](https://github.com/un33k/node-ipware/issues)

.....
