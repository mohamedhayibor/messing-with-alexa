## Alexa skill

Gets Alexa to determine the closest bike station's name, number of available bikes and docks. 

### Intent Schema
```json
{
  "intents": [
    {
    "intent": "GetStation",
    "slots": [
    {
    	"name": "Address",
    	"type": "ADDRESS"
    }
  		]
    }
  ]
}
```

### Custom Slot Types

> See listOfStations

### Sample Utterances:
```
GetStation get bikes {Address}
GetStation get bikes for {Address}
GetStation bikes {Address}
```
