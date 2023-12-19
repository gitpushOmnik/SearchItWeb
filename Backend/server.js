import {MongoClient} from "mongodb";
import cors from "cors";
import axios from "axios";
import express from "express";
import {ServerApiVersion} from "mongodb";

const uri = "INSERT MONGO DB URI HERE";

const app = express();
app.use(cors());

var searchResultItems = {};

app.get('/modifyWishList', async (request, response) => {
  var operation = request.query.operation;
  var id = request.query.id;
  var timeStamp = new Date().getTime();

  switch (operation) {
    case 'addToWishList':
      var searchResultItem = {};
      searchResultItem = searchResultItems[id];
      var wishListResponse;
  
      try 
      {        
          const client = new MongoClient(uri, {
              serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
              }
            });
          
          const clientSession = await client.connect();
          const mongoDB = client.db("wishListItemsDatabase");
          const mongoCollection = mongoDB.collection("wishListItemsCollection");
          const isItemPresent = await mongoCollection.findOne({ itemID: id });

          const mongoDBDoc = {
              "itemID": id,
              "itemDetails" : searchResultItem,
              "itemTimestamp": timeStamp
          }
          
          if(!isItemPresent)
          {
              const response = await mongoCollection.insertOne(mongoDBDoc, function(error, result) {
                if (error) {
                  console.log("Error occured in MongoDB", error);
                }
              });
          }

          const wishListArray = await mongoCollection.find().sort({itemTimestamp : 1});
          wishListResponse = await wishListArray.toArray();
          const closed = await client.close();
      } 
      catch (error) {
        console.log("Error occured in MongoDB", error);
      }
      finally 
      {
        response.status(200).json(wishListResponse);
        break;
      }

      case 'deleteFromWishList':
        var wishListResponse;
        try 
        {        
          const client = new MongoClient(uri, {
              serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
              }
            });
            
          const clientSession = await client.connect();
          const mongoDB = client.db("wishListItemsDatabase");
          const mongoCollection = mongoDB.collection("wishListItemsCollection");
          const isItemPresent = await mongoCollection.findOne({ itemID: id})

          if(isItemPresent){
              await mongoCollection.deleteOne({ itemID: id });
            }
          
          const wishListArray = await mongoCollection.find().sort({itemTimestamp : 1});
          wishListResponse = await wishListArray.toArray();
          const closed = await client.close();
        } 
        catch (error) {
          console.log("Error occured in MongoDB", error);
        }
        finally 
        {
          response.status(200).json(wishListResponse);
          break;
        }
  }
});


app.get('/retrieveWishList', async (request, response)  => {

    var wishListResponse;
    try 
    {         
      const client = new MongoClient(uri, {
          serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
          }
        });
        
      const clientSession = await client.connect();
      const mongoDB = client.db("wishListItemsDatabase");
      const mongoCollection = mongoDB.collection("wishListItemsCollection");

      const wishListArray = await mongoCollection.find().sort({itemTimestamp : 1});
      wishListResponse = await wishListArray.toArray();
      const closed = await client.close(); 
    } 
    catch (error) {
      console.log("Error occured in MongoDB", error);
    }
    finally 
    {
        response.status(200).json(wishListResponse);
    }
  });


app.get('/getSearchItems', async (request, response) => {
    
  var keywords = request.query.keywords
  var categoryType = request.query.categoryType
  var condition = Array.isArray(request.query.condition) ? request.query.condition : [request.query.condition];
  var shipping = Array.isArray(request.query.shipping) ? request.query.shipping : [request.query.shipping];
  var distance = request.query.distance
  var zipcode = request.query.zipcode

  var item_filter_count = 0

  var HEADERS = {
        "OPERATION-NAME":"findItemsAdvanced",
        "SERVICE-VERSION":"1.0.0",
        "SECURITY-APPNAME":"API_KEY",
        "RESPONSE-DATA-FORMAT":"JSON",
        "REST-PAYLOAD":"true",
  }

  var SEARCH_QUERY_PARAMETERS = {
    "keywords": keywords            
  }

  if(categoryType != null && categoryType.length > 0) {
    
    if (categoryType === "art") {
      SEARCH_QUERY_PARAMETERS["categoryId"] = "550"
    } else if (categoryType === "baby") {
      SEARCH_QUERY_PARAMETERS["categoryId"] = "2984"
    } else if (categoryType === "books") {
      SEARCH_QUERY_PARAMETERS["categoryId"] = "267"
    } else if (categoryType === "clothing") {
      SEARCH_QUERY_PARAMETERS["categoryId"] = "11450"
    } else if (categoryType === "computers") {
      SEARCH_QUERY_PARAMETERS["categoryId"] = "58058"
    } else if (categoryType === "health") {
      SEARCH_QUERY_PARAMETERS["categoryId"] = "26395"
    } else if (categoryType === "music") {
      SEARCH_QUERY_PARAMETERS["categoryId"] = "11233"
    } else if (categoryType === "videoGames") {
      SEARCH_QUERY_PARAMETERS["categoryId"] = "1249"
    } 
  }


  if(condition != null && condition.length > 0 && condition[0] != null)
  {
    SEARCH_QUERY_PARAMETERS["itemFilter("+String(item_filter_count)+").name"] = "Condition"
    var value_filter_count = 0


    for (var i=0; i<condition.length; i++) {
      var cond = condition[i]

      if(cond == "new"){
        SEARCH_QUERY_PARAMETERS["itemFilter("+String(item_filter_count)+").value("+String(value_filter_count)+")"] = 1000
      }
      else if(cond == "used"){
        SEARCH_QUERY_PARAMETERS["itemFilter("+String(item_filter_count)+").value("+String(value_filter_count)+")"] = 3000
      }
      value_filter_count += 1
    }

    item_filter_count += 1
  }

  if(shipping != null && shipping.length > 0 && shipping[0] != null) {
    if (shipping.includes("free")) {
      SEARCH_QUERY_PARAMETERS["itemFilter(" + item_filter_count + ").name"] = "FreeShippingOnly"
      SEARCH_QUERY_PARAMETERS["itemFilter(" + item_filter_count + ").value"] = "true"
      item_filter_count += 1
    }
  
    if (shipping.includes("local")) {
      SEARCH_QUERY_PARAMETERS["itemFilter(" + item_filter_count + ").name"] = "LocalPickupOnly"
      SEARCH_QUERY_PARAMETERS["itemFilter(" + item_filter_count + ").value"] = "true"
      item_filter_count += 1;
    }
  }

  if(distance!= null && distance.length > 0)
  {
    var distanceInt = parseInt(distance)
    if(distanceInt < 5)
        distance="5";
    
    SEARCH_QUERY_PARAMETERS["itemFilter(" + item_filter_count + ").name"] = "MaxDistance"
    SEARCH_QUERY_PARAMETERS["itemFilter(" + item_filter_count + ").value"] = distance    
  }

  if(zipcode != null && zipcode.length > 0)
  {
    SEARCH_QUERY_PARAMETERS["buyerPostalCode"] = zipcode
  }

  SEARCH_QUERY_PARAMETERS["paginationInput.entriesPerPage"] = "50";
  SEARCH_QUERY_PARAMETERS["outputSelector(0)"] = "SellerInfo";
  SEARCH_QUERY_PARAMETERS["outputSelector(1)"] = "StoreInfo";

  var FINAL_QUERY_PARAMETERS = {...HEADERS, ...SEARCH_QUERY_PARAMETERS}

  axios.get("https://svcs.ebay.com/services/search/FindingService/v1?", {
    params: FINAL_QUERY_PARAMETERS
  }).then(responseData => {
    searchResultItems = {}
    var jsonResponse = responseData.data
    var successAcknowledgementString = jsonResponse.findItemsAdvancedResponse[0].ack 
    if (successAcknowledgementString == "Success" && jsonResponse.findItemsAdvancedResponse[0].searchResult.length > 0) {  
      var searchResultItemsResponseCount = jsonResponse.findItemsAdvancedResponse[0].searchResult[0]["@count"]
      if (searchResultItemsResponseCount != 0) {
        if (jsonResponse.findItemsAdvancedResponse[0].searchResult[0].item) {
          var jsonSearchResults = jsonResponse.findItemsAdvancedResponse[0].searchResult[0].item;
          for (var itemIndex = 0; itemIndex < jsonSearchResults.length; itemIndex++) {
            searchResultItems[jsonSearchResults[itemIndex].itemId] = jsonSearchResults[itemIndex]
          }
        }
      }
    }
    
    response.status(200).json(jsonResponse);

    }).catch(error => {
      response.status(500).send(error);
    });
});

app.get('/getItemDetails', async (request, response) => {

  var id = request.query.id;

    var client_id = 'CLIENT_ID_KEY';
    var client_secret = 'CLIENT_SECRET_KEY';

    const oauthToken = new OAuthToken(client_id, client_secret);

    var application_token = await oauthToken.getApplicationToken()
      .then((application_token) => {
          return application_token;
      })
      .catch((error) => {
          console.error("Item Details Error Occured", error);
      });
    
    var HEADERS = {
      "X-EBAY-API-IAF-TOKEN": application_token
    };

    var PARAMETERS = {
      "appid":"API_KEY",
      "ItemID":id,
      "callname":"GetSingleItem",
      "siteid":"0",
      "responseencoding":"JSON",
      "IncludeSelector":"Description,Details,ItemSpecifics",
      "version":"967"
    };  

    axios.get("https://open.api.ebay.com/shopping?", {
      params: PARAMETERS,
      headers: HEADERS
    })
    .then(
      async (itemDetailsResponse) => {

        var title = "";
        if(itemDetailsResponse && "data" in itemDetailsResponse && itemDetailsResponse.data && "Item" in itemDetailsResponse.data && itemDetailsResponse.data.Item && "Title" in itemDetailsResponse.data.Item) {
          var title = itemDetailsResponse["data"]["Item"]["Title"];
        }

        var PARAMETERS = {
            "q": title,
            "cx": "BROWSER_ID",
            "num": "8",
            "key": "BROWSER_KEY",
            "searchType": "image",
            "imgSize": "huge"
        };  

        axios.get("https://www.googleapis.com/customsearch/v1?", {
          params: PARAMETERS
        })
        .then(
          async (googlePhotosResponse) => {

          var id = request.query.id;

          var PARAMETERS = {
            "CONSUMER-ID": "API_KEY",
            "itemId": id,
            "maxResults": "20",
            "SERVICE-NAME": "MerchandisingService",
            "RESPONSE-DATA-FORMAT": "JSON",
            "SERVICE-VERSION": "1.1.0",
            "REST-PAYLOAD": "",
            "OPERATION-NAME": "getSimilarItems",
          };
      
          axios.get("https://svcs.ebay.com/MerchandisingService?", {
            params: PARAMETERS
          })
          .then(
            async(similarItemsResponse) => {
              var itemDetailsData = itemDetailsResponse.data;
              var similarItemsData = similarItemsResponse.data;
              var googlePhotosData = googlePhotosResponse.data;
  
              response.send({
                itemDetails: itemDetailsData,
                similarItems: similarItemsData,
                googlePhotos: googlePhotosData,
              });         
            })
            .catch(
              async (similarItemsError) => {
              var itemDetailsData = itemDetailsResponse.data;
              var googlePhotosData = googlePhotosResponse.data;

            response.send({
              itemDetails: itemDetailsData,
              similarItems: null,
              googlePhotos: googlePhotosData
            });
          });
        }).catch (
          async (googlePhotosError) => {
            var itemDetailsData = itemDetailsResponse.data;

            response.send({
              itemDetails: itemDetailsData,
              similarItems: null,
              googlePhotos: null
            });
          });
      })
      .catch(
        async (itemDetailsError) => {
          response.send({
            itemDetails: null,
            similarItems: null,
            googlePhotos: null
          });
      });
});


app.get('/autocompleteZipcode', async (request, response) => {
    var zipcode = request.query.zipcode;

    var PARAMETERS = {
        "postalcode_startsWith": zipcode,
        "username" : "USER_NAME",
        "maxRows": "5",
        "country": "US"
    };  

    axios.get("http://api.geonames.org/postalCodeSearchJSON?", {
      params: PARAMETERS
    }).then(responseData => {
      response.status(200).json(responseData.data);
    }).catch(error =>{
      response.status(500).send(error);
    });
});

app.listen(8080, '0.0.0.0', () => {
  console.log('Server listening on port 8080');
});

