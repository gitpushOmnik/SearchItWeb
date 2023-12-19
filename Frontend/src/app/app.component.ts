import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OnInit } from '@angular/core';
import * as moment from 'moment';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{

  title = "csci571-assi3-nikhal"
  constructor(private http: HttpClient) {}

  keywords = "";
  categoryType = "All Categories";
  categoryTypeArray = ["All Categories", "Art", "Baby", "Books", "Clothing, Shoes & Accessories", "Computers/Tablets & Networking", "Health & Beauty", "Music", "Video games & Consoles"];
  newCondition = false;
  usedCondition = false;
  unspecifiedCondition = false;
  localShipping = false;
  freeShipping = false;
  distance = 10;
  location = "currentLocationZipcode";
  userInputZipcode = "";
  fetchedZipcodes: string[] = [];
  currentLocationZipcode = 90011;

  resultsProgressBarLoading = false;

  searchResultItems: any[] | null = null;
  showResultItemDetails = false;
  lastViewedResultItem: any | null = null;

  wishListItems: any[] | null = null;
  wishListItemIDs: any[] = [];
  showWishListItems = false;
  showWishListItemDetails = false;
  lastViewedWishListItem: any | null = null;
  wishListResponse: any | null = null;
  lastViewedWishListDetailButton = false;

  currentPageNumber = 1;
  currentPageSize = 10;
  totalPages = 0;
  pageNumbersArray = [1,2,3,4,5];
  totalShoppingCost = 0;
  sortingPreference = "Ascending";
  displayCriteria = "Default";

  ngOnInit() {
    this.getWishListItemsFromDB();
    this.retrieveCurrentZipcode();
  }

  getWishListItemsFromDB() {
    this.http.get("https://csci571-assi3-nikhal-backend.uc.r.appspot.com/retrieveWishlist").subscribe((wishListResponse: any) => {
      this.wishListResponse = wishListResponse;
      this.showWishListItemDetails = false;
      this.retrieveWishListItems(true);
    });
  }

  retrieveCurrentZipcode() {
    this.http.get("http://ip-api.com/json")
    .subscribe((currentZipcode: any) => {
      this.currentLocationZipcode= currentZipcode["zip"];
    });
  }

  autoSuggestZipcodes(zipcodeEvent: any) {
    var zipcode = zipcodeEvent.target.value;
      
    this.http.get(`https://csci571-assi3-nikhal-backend.uc.r.appspot.com/autocompleteZipcode?zipcode=${zipcode}`, {
    }).subscribe((zipcodeResponse: any) => {
      this.fetchedZipcodes = [];
      var postalCodesLength = zipcodeResponse.postalCodes.length
      for(var postalIndex=0; postalIndex<postalCodesLength; postalIndex++) {
        var fetchedZipcode = zipcodeResponse.postalCodes[postalIndex]['postalCode']
        this.fetchedZipcodes.push(fetchedZipcode);
      }
    });
  }

  retrieveSearchResultItems() {

    this.resetSortingPreference();
    this.currentPageNumber = 1;
    this.resultsProgressBarLoading = true;
    this.showWishListItems = false;
    this.showWishListItemDetails = false;
    this.showResultItemDetails = false;
    
    var keywordsString = "keywords=" + this.keywords;
    

    var selectedCategory = "";

    if (this.categoryType == "Art") {
      selectedCategory = "art";
    } else if (this.categoryType == "Baby") {
      selectedCategory = "baby";
    } else if (this.categoryType == "Books") {
      selectedCategory = "books";
    } else if (this.categoryType == "Clothing, Shoes & Accessories") {
      selectedCategory = "clothing";
    } else if (this.categoryType == "Computers/Tablets & Networking") {
      selectedCategory = "computers";
    } else if (this.categoryType == "Health & Beauty") {
      selectedCategory = "health";
    } else if (this.categoryType == "Music") {
      selectedCategory = "music";
    } else if (this.categoryType == "Video games & Consoles") {
      selectedCategory = "videoGames";
    } 

    var categoryTypeString = "&categoryType=" + selectedCategory;


    var conditionString = "";

    if(this.newCondition == true) 
      conditionString += "&condition=new";

    if(this.usedCondition == true)
      conditionString += "&condition=used";


    var shippingString = "";

    if(this.localShipping == true)
      shippingString += "&shipping=local";

    if(this.freeShipping == true)
      shippingString += "&shipping=free";


    var distanceString = "&distance="+String(this.distance);


    var locationString = "";
    if (this.location == "currentLocationZipcode") {
      locationString += "&zipcode=" + String(this.currentLocationZipcode);
    } else {
      locationString += "&zipcode=" + this.userInputZipcode;
    }


    var searchQueryString = keywordsString + categoryTypeString + conditionString + shippingString + distanceString + locationString;

    this.http.get(`https://csci571-assi3-nikhal-backend.uc.r.appspot.com/getSearchItems?${searchQueryString}`, {
    }).subscribe((searchItemsResponse: any) => {

      this.resultsProgressBarLoading = false;
      this.searchResultItems = [];

      var successAcknowledgementString = searchItemsResponse.findItemsAdvancedResponse[0].ack ;
      if (successAcknowledgementString == "Success" && searchItemsResponse.findItemsAdvancedResponse[0].searchResult.length > 0) {  
        var searchResultItemsResponseCount = searchItemsResponse.findItemsAdvancedResponse[0].searchResult[0]["@count"];
        if (searchResultItemsResponseCount != 0) {
          if (searchItemsResponse.findItemsAdvancedResponse[0].searchResult[0].item) {
            var searchResultItems = searchItemsResponse.findItemsAdvancedResponse[0].searchResult[0].item;
            for (var itemIndex = 0; itemIndex < searchResultItems.length; itemIndex++) {
           
              var searchResultItem: any = {};
              var item = searchResultItems[itemIndex];

              if (item && "itemId" in item && item.itemId && item.itemId.length > 0) {
                var itemID = item.itemId[0];
                searchResultItem["itemID"] = itemID;
              }

              searchResultItem["itemIndexNumber"] = itemIndex;
              searchResultItem["itemSerialNumber"] = itemIndex + 1;

              if ("galleryURL" in item && item.galleryURL && item.galleryURL.length > 0) {
                searchResultItem["itemImageURL"] = item.galleryURL[0];
              }

              if (item && "title" in item && item.title && item.title.length > 0) {
                var itemTitle = item.title[0];
                searchResultItem["itemTitle"] = itemTitle;
              } else {
                searchResultItem["itemTitle"] = "N/A";
              }

              if (item && "sellingStatus" in item && 
                item.sellingStatus &&
                item.sellingStatus.length > 0 && 
                item.sellingStatus[0] && 
                "currentPrice" in item.sellingStatus[0] && 
                item.sellingStatus[0].currentPrice &&
                item.sellingStatus[0].currentPrice.length > 0 && 
                item.sellingStatus[0].currentPrice[0] && 
                "__value__" in item.sellingStatus[0].currentPrice[0]) {
                  searchResultItem["itemPrice"] = "$" + item.sellingStatus[0].currentPrice[0].__value__;
              } else {
                searchResultItem["itemPrice"] = "N/A";
              }

              if (item && "postalCode" in item && item.postalCode && item.postalCode.length > 0){
                searchResultItem["itemZipcode"] = item.postalCode[0];
              } else {
                searchResultItem["itemZipcode"] = "N/A";
              }
              

              if ("shippingInfo" in item && item.shippingInfo && item.shippingInfo.length > 0) {

                var itemShippingCostString = "N/A";

                if (item.shippingInfo[0] && 
                  "shippingServiceCost" in item.shippingInfo[0] && 
                  item.shippingInfo[0].shippingServiceCost && 
                  item.shippingInfo[0].shippingServiceCost.length > 0 && 
                  item.shippingInfo[0].shippingServiceCost[0] && 
                  "__value__" in item.shippingInfo[0].shippingServiceCost[0]) {

                    var itemShippingCost = item.shippingInfo[0].shippingServiceCost[0].__value__;
                    if (itemShippingCost == 0) {
                      itemShippingCostString = "Free Shipping";
                    } else {
                      itemShippingCostString = "$" + String(itemShippingCost);
                    }
                }

                searchResultItem["itemShippingCost"] = itemShippingCostString;

                if (item.shippingInfo[0] && "returnsAccepted" in item && item.returnsAccepted && item.returnsAccepted.length > 0) 
                  searchResultItem["itemReturnsAccepted"] = item.returnsAccepted[0];

                if (item.shippingInfo[0] && "expeditedShipping" in item.shippingInfo[0] && item.shippingInfo[0].expeditedShipping && item.shippingInfo[0].expeditedShipping.length > 0) 
                  searchResultItem["itemExpeditedShipping"] = item.shippingInfo[0].expeditedShipping[0];
                

                if (item.shippingInfo[0] && "oneDayShippingAvailable" in item.shippingInfo[0] && item.shippingInfo[0].oneDayShippingAvailable && item.shippingInfo[0].oneDayShippingAvailable.length > 0) 
                  searchResultItem["itemOneDayShipping"] = item.shippingInfo[0].oneDayShippingAvailable[0];
                

                if (item.shippingInfo[0] && "handlingTime" in item.shippingInfo[0] && item.shippingInfo[0].handlingTime && item.shippingInfo[0].handlingTime.length > 0) 
                  searchResultItem["itemHandlingTime"] = item.shippingInfo[0].handlingTime[0];
                

                if (item.shippingInfo[0] && "shipToLocations" in item.shippingInfo[0] && item.shippingInfo[0].shipToLocations && item.shippingInfo[0].shipToLocations.length > 0) 
                  searchResultItem["itemShippingLocations"] = item.shippingInfo[0].shipToLocations[0];
                
              }
              
              if (item && "sellerInfo" in item && item.sellerInfo && item.sellerInfo.length > 0) {
                if (item.sellerInfo[0] && 
                  "sellerUserName" in item.sellerInfo[0] && 
                  item.sellerInfo[0].sellerUserName && 
                  item.sellerInfo[0].sellerUserName.length > 0) {
                  searchResultItem["itemSellerName"] = item.sellerInfo[0].sellerUserName[0];
                } else {
                  searchResultItem["itemSellerName"] = "N/A";
                }
              }

              this.searchResultItems.push(searchResultItem);
            }
          }
        }

        this.showWishListItems = false;
        this.showWishListItemDetails = false;
        this.showResultItemDetails = false; 
        this.resultsProgressBarLoading = false;     
        var searchResultItemsLength = this.searchResultItems.length;
        this.totalPages = Math.ceil(searchResultItemsLength / this.currentPageSize);
      }
    })
  }


  retrieveSearchResultItemDetails(itemID: number, itemIndexNumber: number) {
        window.scrollTo({
      top: 0
    });

    this.resultsProgressBarLoading = true
    this.showWishListItems = false;
    this.showWishListItemDetails = false;
    this.showResultItemDetails = false;
    var itemIDString = "id="+String(itemID);

    this.http.get(`https://csci571-assi3-nikhal-backend.uc.r.appspot.com/getItemDetails/?${itemIDString}`)
    .subscribe((itemDetailsResponse: any) => {

      if(itemDetailsResponse) {
        if ("itemDetails" in itemDetailsResponse && "Item" in itemDetailsResponse.itemDetails) {
          var itemDetail = itemDetailsResponse.itemDetails.Item;

          var itemDetailDictionary: any = {};

          itemDetailDictionary["itemID"] = itemID;

          if (itemDetail && "ViewItemURLForNaturalSearch" in itemDetail)
            itemDetailDictionary["itemURL"] = itemDetail.ViewItemURLForNaturalSearch;

          if (itemDetail && "PictureURL" in itemDetail)
            itemDetailDictionary["itemImageURL"] = itemDetail.PictureURL;

          if (itemDetail && "Location" in itemDetail) 
            itemDetailDictionary["itemLocation"] = itemDetail.Location;

          if (itemDetail && "Title" in itemDetail)
            itemDetailDictionary["itemTitle"] = itemDetail.Title;
          
          if (itemDetail && "CurrentPrice" in itemDetail && itemDetail.CurrentPrice && "Value" in itemDetail.CurrentPrice) {
            var itemPriceString = "$" + itemDetail.CurrentPrice.Value;
            itemDetailDictionary["itemPrice"] = itemPriceString;
          }
          
          if (itemDetail && "ReturnPolicy" in itemDetail && itemDetail.ReturnPolicy && "ReturnsAccepted" in itemDetail.ReturnPolicy) {
            var returnsAccepted = itemDetail.ReturnPolicy.ReturnsAccepted;

            if (itemDetail && itemDetail.ReturnPolicy && "ReturnsWithin" in itemDetail.ReturnPolicy) {
              var returnsWithin = itemDetail.ReturnPolicy.ReturnsWithin;
              itemDetailDictionary["itemReturnPolicy"] = returnsAccepted + " within " + returnsWithin
            } else {
              itemDetailDictionary["itemReturnPolicy"] = returnsAccepted;
            }
          }

          if (itemDetail && "ItemSpecifics" in itemDetail && itemDetail.ItemSpecifics && "NameValueList" in itemDetail.ItemSpecifics) {
            var itemNameValueList = itemDetail.ItemSpecifics.NameValueList
            itemDetailDictionary["itemSpecifics"] = itemNameValueList;
          } else {
            itemDetailDictionary["itemSpecifics"] = [];
          }

          var googlePhotosArray = [[], [], []]
          itemDetailDictionary["itemGooglePhotos"] = googlePhotosArray;

          if (itemDetailsResponse && "googlePhotos" in itemDetailsResponse && itemDetailsResponse.googlePhotos && "items" in itemDetailsResponse.googlePhotos) {
            var itemGooglePhotos = itemDetailsResponse.googlePhotos.items;

            itemGooglePhotos.forEach((googleImage: any, index: any) => {
              var googlePhotosLink = googleImage.link
              if(index == 6 || index == 7) {
                itemDetailDictionary["itemGooglePhotos"][(index + 1) % 3].push(googlePhotosLink);
              } else{
                itemDetailDictionary["itemGooglePhotos"][index % 3].push(googlePhotosLink);
              }
            });
          } 


        var itemShippingDetails: any | null = null;

        if (this.searchResultItems && itemIndexNumber >= 0) 
            itemShippingDetails = this.searchResultItems[itemIndexNumber];
        

        if (itemShippingDetails != null) {

          if ("itemShippingLocations" in itemShippingDetails) 
            itemDetailDictionary["itemShippingLocations"] = itemShippingDetails.itemShippingLocations;

          if ("itemShippingCost" in itemShippingDetails) 
            itemDetailDictionary["itemShippingCost"] = itemShippingDetails.itemShippingCost;

          if ("itemExpeditedShipping" in itemShippingDetails) 
            itemDetailDictionary["itemExpeditedShipping"] = itemShippingDetails.itemExpeditedShipping;

          if ("itemReturnsAccepted" in itemShippingDetails) 
            itemDetailDictionary["itemReturnsAccepted"] = itemShippingDetails.itemReturnsAccepted;

          if ("itemOneDayShipping" in itemShippingDetails) 
            itemDetailDictionary["itemOneDayShipping"] = itemShippingDetails.itemOneDayShipping;
          
          if ("itemHandlingTime" in itemShippingDetails && itemShippingDetails.itemHandlingTime.length > 0) {
            var itemHandlingTimeDays = itemShippingDetails.itemHandlingTime[0];
            if (itemHandlingTimeDays == 0 || itemHandlingTimeDays == 1) {
              itemDetailDictionary["itemHandlingTime"] = itemHandlingTimeDays + " Day";
            } else {
              itemDetailDictionary["itemHandlingTime"] = itemHandlingTimeDays + " Days";
            }
          }
        }

        if (itemDetail && "Seller" in itemDetail) {
          var itemSeller = itemDetail.Seller;
          
          if ("FeedbackRatingStar" in itemSeller)
            itemDetailDictionary["itemFeedbackRatingStar"] = itemSeller.FeedbackRatingStar;
          
          if("FeedbackScore" in itemSeller)
            itemDetailDictionary["itemFeedbackRatingScore"] = itemSeller.FeedbackScore;

          if ("UserID" in itemSeller)
            itemDetailDictionary["itemSellerName"] = itemSeller.UserID;

          if ("FeedbackRatingStar" in itemSeller && "FeedbackScore" in itemSeller) {

            if (itemSeller.FeedbackScore < 10000) {
              itemDetailDictionary["itemFeedbackRatingStarDesign"] = 'star_border';
            } else {
              itemDetailDictionary["itemFeedbackRatingStarDesign"] = 'stars';
            }

            itemDetailDictionary["itemFeedbackRatingStarAlignment"] = {"vertical-align": "middle"};

            if (itemSeller.FeedbackRatingStar == "Blue"){
              itemDetailDictionary["itemFeedbackRatingStarAlignment"]["color"] = "blue";
            } else if (itemSeller.FeedbackRatingStar == "Red" || itemSeller.FeedbackRatingStar == "RedShooting") {
              itemDetailDictionary["itemFeedbackRatingStarAlignment"]["color"] = "red";
            } else if (itemSeller.FeedbackRatingStar == "SilverShooting") {
              itemDetailDictionary["itemFeedbackRatingStarAlignment"]["color"] = "silver";
            } else if (itemSeller.FeedbackRatingStar == "Turquoise" || itemSeller.FeedbackRatingStar == "TurquoiseShooting") {
              itemDetailDictionary["itemFeedbackRatingStarAlignment"]["color"] = "turquoise";
            } else if (itemSeller.FeedbackRatingStar == "Green" || itemSeller.FeedbackRatingStar == "GreenShooting") {
              itemDetailDictionary["itemFeedbackRatingStarAlignment"]["color"] = "green";
            } else if (itemSeller.FeedbackRatingStar == "Purple" || itemSeller.FeedbackRatingStar == "PurpleShooting") {
              itemDetailDictionary["itemFeedbackRatingStarAlignment"]["color"] = "purple";
            } else if (itemSeller.FeedbackRatingStar == "Yellow" || itemSeller.FeedbackRatingStar == "YellowShooting") {
              itemDetailDictionary["itemFeedbackRatingStarAlignment"]["color"] = "yellow";
            }
          }

          if ("TopRatedSeller" in itemSeller)
            itemDetailDictionary["itemTopRated"] = itemSeller.TopRatedSeller;

          if ("PositiveFeedbackPercent" in itemSeller)
            itemDetailDictionary["itemPositiveFeedbackRatingPercentage"] = itemSeller.PositiveFeedbackPercent;
        }

        if (itemDetail && "Storefront" in itemDetail) {
          if (itemDetail.Storefront && "StoreURL" in itemDetail.Storefront)
            itemDetailDictionary["itemStoreURL"] = itemDetail.Storefront.StoreURL;

          if (itemDetail.Storefront && "StoreName" in itemDetail.Storefront)
            itemDetailDictionary["itemStoreName"] = itemDetail.Storefront.StoreName;
        }


        if(itemDetailsResponse && "similarItems" in itemDetailsResponse && 
          itemDetailsResponse.similarItems && "getSimilarItemsResponse" in itemDetailsResponse.similarItems && 
          itemDetailsResponse.similarItems.getSimilarItemsResponse && 
          "itemRecommendations" in itemDetailsResponse.similarItems.getSimilarItemsResponse && 
          itemDetailsResponse.similarItems.getSimilarItemsResponse.itemRecommendations && 
          "item" in itemDetailsResponse.similarItems.getSimilarItemsResponse.itemRecommendations){


          var similarItemsArray = itemDetailsResponse.similarItems.getSimilarItemsResponse.itemRecommendations.item ; 

          var similarItemsDictionaryArray: any = [];
          var similarItemsDictionary: any = {};

          similarItemsArray.forEach((similarItem:any, index: any) => {
            similarItemsDictionary = {}

            similarItemsDictionary.itemIndex = index;
            similarItemsDictionary.itemTitle = similarItem.title;
            similarItemsDictionary.itemImageURL = similarItem.imageURL;
            similarItemsDictionary.itemPrice = similarItem.buyItNowPrice.__value__;
            similarItemsDictionary.itemShippingCost = similarItem.shippingCost.__value__;

            var daysLeft = moment.duration(similarItem.timeLeft).days()
            similarItemsDictionary.itemDaysLeft=daysLeft;

            similarItemsDictionaryArray.push(similarItemsDictionary);
          });

          itemDetailDictionary["similarItems"] = similarItemsDictionaryArray;
          itemDetailDictionary["similarItemsCount"] = similarItemsDictionaryArray.length <= 5 ? similarItemsDictionaryArray.length : 5;
        } 

        this.lastViewedResultItem = itemDetailDictionary;
        this.resultsProgressBarLoading = false;
        this.showWishListItems = false;
        this.showWishListItemDetails = false;
        this.showResultItemDetails = true
        }
      }
    });
  }

  retrieveWishListItems(calledFromNg? : boolean, calledFromAddRemove?: boolean) {
    
    var totalShoppingCost = 0;
    this.wishListItems = [];
    this.wishListItemIDs = [];

    if(this.wishListResponse && this.wishListResponse.length > 0) {

      for (var itemIndex = 0; itemIndex < this.wishListResponse.length; itemIndex++) {
      
        var wishListItem: any = {};
        var item = this.wishListResponse[itemIndex].itemDetails;

        if (item && "itemId" in item && item.itemId && item.itemId.length > 0) {
          var itemID = item.itemId[0];
          wishListItem["itemID"] = itemID;
          this.wishListItemIDs.push(itemID);
        }

        wishListItem["itemIndexNumber"] = itemIndex;
        wishListItem["itemSerialNumber"] = itemIndex + 1;

        if ("galleryURL" in item && item.galleryURL && item.galleryURL.length > 0) {
          wishListItem["itemImageURL"] = item.galleryURL[0];
        }

        if (item && "title" in item && item.title && item.title.length > 0) {
          var itemTitle = item.title[0];
          wishListItem["itemTitle"] = itemTitle;
        } else {
          wishListItem["itemTitle"] = "N/A";
        }

        if (item && "sellingStatus" in item && 
          item.sellingStatus &&
          item.sellingStatus.length > 0 && 
          item.sellingStatus[0] && 
          "currentPrice" in item.sellingStatus[0] && 
          item.sellingStatus[0].currentPrice &&
          item.sellingStatus[0].currentPrice.length > 0 && 
          item.sellingStatus[0].currentPrice[0] && 
          "__value__" in item.sellingStatus[0].currentPrice[0]) {
          totalShoppingCost += parseFloat(item.sellingStatus[0].currentPrice[0].__value__)
          wishListItem["itemPrice"] = "$" + item.sellingStatus[0].currentPrice[0].__value__;
        } else {
          wishListItem["itemPrice"] = "N/A";
        }

        if (item && "postalCode" in item && item.postalCode && item.postalCode.length > 0){
          wishListItem["itemZipcode"] = item.postalCode[0];
        } else {
          wishListItem["itemZipcode"] = "N/A";
        }

        if ("shippingInfo" in item && item.shippingInfo && item.shippingInfo.length > 0) {

          var itemShippingCostString = "N/A";

          if (item.shippingInfo[0] && 
            "shippingServiceCost" in item.shippingInfo[0] && 
            item.shippingInfo[0].shippingServiceCost && 
            item.shippingInfo[0].shippingServiceCost.length > 0 && 
            item.shippingInfo[0].shippingServiceCost[0] && 
            "__value__" in item.shippingInfo[0].shippingServiceCost[0]) {      

              var itemShippingCost = item.shippingInfo[0].shippingServiceCost[0].__value__;
              if (itemShippingCost == 0) {
                itemShippingCostString = "Free Shipping";
              } else {
                itemShippingCostString = "$" + String(itemShippingCost);
              }
          }

          wishListItem["itemShippingCost"] = itemShippingCostString;

          if (item.shippingInfo[0] && "returnsAccepted" in item && item.returnsAccepted && item.returnsAccepted.length > 0)
            wishListItem["itemReturnsAccepted"] = item.returnsAccepted[0];
          

          if (item.shippingInfo[0] && "expeditedShipping" in item.shippingInfo[0] && item.shippingInfo[0].expeditedShipping && item.shippingInfo[0].expeditedShipping.length > 0) 
            wishListItem["itemExpeditedShipping"] = item.shippingInfo[0].expeditedShipping[0];
          

          if (item.shippingInfo[0] && "oneDayShippingAvailable" in item.shippingInfo[0] && item.shippingInfo[0].oneDayShippingAvailable && item.shippingInfo[0].oneDayShippingAvailable.length > 0) 
            wishListItem["itemOneDayShipping"] = item.shippingInfo[0].oneDayShippingAvailable[0];
          
          if (item.shippingInfo[0] && "handlingTime" in item.shippingInfo[0] && item.shippingInfo[0].handlingTime && item.shippingInfo[0].handlingTime.length > 0) 
            wishListItem["itemHandlingTime"] = item.shippingInfo[0].handlingTime[0];
          
          if (item.shippingInfo[0] && "shipToLocations" in item.shippingInfo[0] && item.shippingInfo[0].shipToLocations && item.shippingInfo[0].shipToLocations.length > 0) 
            wishListItem["itemShippingLocations"] = item.shippingInfo[0].shipToLocations[0];

        }
        
        if (item && "sellerInfo" in item && item.sellerInfo && item.sellerInfo.length > 0) {
          if (item.sellerInfo[0] && 
            "sellerUserName" in item.sellerInfo[0] && 
            item.sellerInfo[0].sellerUserName && 
            item.sellerInfo[0].sellerUserName.length > 0) {
            wishListItem["itemSellerName"] = item.sellerInfo[0].sellerUserName[0];
          } else {
            wishListItem["itemSellerName"] = "N/A";
          }
        }

        this.wishListItems.push(wishListItem);
      }
    }

    this.totalShoppingCost = totalShoppingCost;

    if (calledFromNg == true) {
      if (calledFromAddRemove == true) {
      } 
      else {
        this.showWishListItems = false;
      }
    } else {
      if (calledFromAddRemove == true) {

      } else {
        this.showWishListItems = true;
        this.showWishListItemDetails = false;
      }
    }
  }

  retrieveWishListItemDetails(itemID: number, itemIndexNumber: number): void {
    
    window.scrollTo({
      top: 0
    });

    this.showWishListItemDetails = false;
    this.showResultItemDetails = false;
    this.lastViewedWishListDetailButton = true;
    var itemIDString = "id="+String(itemID);

    this.http.get(`https://csci571-assi3-nikhal-backend.uc.r.appspot.com/getItemDetails/?${itemIDString}`)
    .subscribe((itemDetailsResponse: any) => {

      if(itemDetailsResponse) {
        if ("itemDetails" in itemDetailsResponse && "Item" in itemDetailsResponse.itemDetails) {
          var itemDetail = itemDetailsResponse.itemDetails.Item;

          var itemDetailDictionary: any = {};

          itemDetailDictionary["itemID"] = itemID;

          if (itemDetail && "ViewItemURLForNaturalSearch" in itemDetail)
            itemDetailDictionary["itemURL"] = itemDetail.ViewItemURLForNaturalSearch;

          if (itemDetail && "PictureURL" in itemDetail)
            itemDetailDictionary["itemImageURL"] = itemDetail.PictureURL;

          if (itemDetail && "Title" in itemDetail)
            itemDetailDictionary["itemTitle"] = itemDetail.Title;
            
          if (itemDetail && "Location" in itemDetail) 
            itemDetailDictionary["itemLocation"] = itemDetail.Location;
          
          if (itemDetail && "CurrentPrice" in itemDetail && itemDetail.CurrentPrice && "Value" in itemDetail.CurrentPrice) {
            var itemPriceString = "$" + itemDetail.CurrentPrice.Value;
            itemDetailDictionary["itemPrice"] = itemPriceString;
          }

          if (itemDetail && "ReturnPolicy" in itemDetail && itemDetail.ReturnPolicy && "ReturnsAccepted" in itemDetail.ReturnPolicy) {
            var returnsAccepted = itemDetail.ReturnPolicy.ReturnsAccepted;

            if (itemDetail.ReturnPolicy && "ReturnsWithin" in itemDetail.ReturnPolicy) {
              var returnsWithin = itemDetail.ReturnPolicy.ReturnsWithin;
              itemDetailDictionary["itemReturnPolicy"] = returnsAccepted + " within " + returnsWithin;
            } else {
              itemDetailDictionary["itemReturnPolicy"] = returnsAccepted;
            }
          }

          if (itemDetail && "ItemSpecifics" in itemDetail && itemDetail.ItemSpecifics && "NameValueList" in itemDetail.ItemSpecifics) {
            var itemNameValueList = itemDetail.ItemSpecifics.NameValueList
            itemDetailDictionary["itemSpecifics"] = itemNameValueList;
          } else {
            itemDetailDictionary["itemSpecifics"] = [];
          }

          var googlePhotosArray = [[], [], []]
          itemDetailDictionary["itemGooglePhotos"] = googlePhotosArray;

          if (itemDetailsResponse && "googlePhotos" in itemDetailsResponse && itemDetailsResponse.googlePhotos && "items" in itemDetailsResponse.googlePhotos) {
            var itemGooglePhotos = itemDetailsResponse.googlePhotos.items;

            itemGooglePhotos.forEach((googleImage: any, index: any) => {
              var googlePhotosLink = googleImage.link
              if(index == 6 || index == 7) {
                itemDetailDictionary["itemGooglePhotos"][(index + 1) % 3].push(googlePhotosLink);
              } else{
                itemDetailDictionary["itemGooglePhotos"][index % 3].push(googlePhotosLink);
              }
            });
          } 

          var itemShippingDetails: any | null = null;

          if (this.wishListItems && itemIndexNumber >= 0) 
              itemShippingDetails = this.wishListItems[itemIndexNumber];
            

          if (itemShippingDetails != null) {

            if ("itemShippingLocations" in itemShippingDetails) 
              itemDetailDictionary["itemShippingLocations"] = itemShippingDetails.itemShippingLocations;

            if ("itemShippingCost" in itemShippingDetails) 
              itemDetailDictionary["itemShippingCost"] = itemShippingDetails.itemShippingCost;

            if ("itemExpeditedShipping" in itemShippingDetails) 
              itemDetailDictionary["itemExpeditedShipping"] = itemShippingDetails.itemExpeditedShipping;

            if ("itemReturnsAccepted" in itemShippingDetails) 
              itemDetailDictionary["itemReturnsAccepted"] = itemShippingDetails.itemReturnsAccepted;

            if ("itemOneDayShipping" in itemShippingDetails) 
              itemDetailDictionary["itemOneDayShipping"] = itemShippingDetails.itemOneDayShipping;

            if ("itemHandlingTime" in itemShippingDetails && itemShippingDetails.itemHandlingTime.length > 0) {
              var itemHandlingTimeDays = itemShippingDetails.itemHandlingTime[0];
              if (itemHandlingTimeDays == 0 || itemHandlingTimeDays == 1) {
                itemDetailDictionary["itemHandlingTime"] = itemHandlingTimeDays + " Day";
              } else {
                itemDetailDictionary["itemHandlingTime"] = itemHandlingTimeDays + " Days";
              }
            }
          }


          if (itemDetail && "Seller" in itemDetail) {
            var itemSeller = itemDetail.Seller;

            if ("FeedbackRatingStar" in itemSeller)
              itemDetailDictionary["itemFeedbackRatingStar"] = itemSeller.FeedbackRatingStar;

            if("FeedbackScore" in itemSeller)
              itemDetailDictionary["itemFeedbackRatingScore"] = itemSeller.FeedbackScore;

            if ("UserID" in itemSeller)
              itemDetailDictionary["itemSellerName"] = itemSeller.UserID;
            
            if ("FeedbackRatingStar" in itemSeller && "FeedbackScore" in itemSeller) {

              if (itemSeller.FeedbackScore < 10000) {
                itemDetailDictionary["itemFeedbackRatingStarDesign"] = 'star_border';
              } else {
                itemDetailDictionary["itemFeedbackRatingStarDesign"] = 'stars';
              }              
              
              itemDetailDictionary["itemFeedbackRatingStarAlignment"] = {"vertical-align": "middle"};

              if (itemSeller.FeedbackRatingStar == "Blue"){
                itemDetailDictionary["itemFeedbackRatingStarAlignment"]["color"] = "blue";
              } else if (itemSeller.FeedbackRatingStar == "Red" || itemSeller.FeedbackRatingStar == "RedShooting") {
                itemDetailDictionary["itemFeedbackRatingStarAlignment"]["color"] = "red";
              } else if (itemSeller.FeedbackRatingStar == "SilverShooting") {
                itemDetailDictionary["itemFeedbackRatingStarAlignment"]["color"] = "silver";
              } else if (itemSeller.FeedbackRatingStar == "Turquoise" || itemSeller.FeedbackRatingStar == "TurquoiseShooting") {
                itemDetailDictionary["itemFeedbackRatingStarAlignment"]["color"] = "turquoise";
              } else if (itemSeller.FeedbackRatingStar == "Green" || itemSeller.FeedbackRatingStar == "GreenShooting") {
                itemDetailDictionary["itemFeedbackRatingStarAlignment"]["color"] = "green";
              } else if (itemSeller.FeedbackRatingStar == "Purple" || itemSeller.FeedbackRatingStar == "PurpleShooting") {
                itemDetailDictionary["itemFeedbackRatingStarAlignment"]["color"] = "purple";
              } else if (itemSeller.FeedbackRatingStar == "Yellow" || itemSeller.FeedbackRatingStar == "YellowShooting") {
                itemDetailDictionary["itemFeedbackRatingStarAlignment"]["color"] = "yellow";
              }        
            }

            if ("TopRatedSeller" in itemSeller)
              itemDetailDictionary["itemTopRated"] = itemSeller.TopRatedSeller;

            if ("PositiveFeedbackPercent" in itemSeller)
              itemDetailDictionary["itemPositiveFeedbackRatingPercentage"] = itemSeller.PositiveFeedbackPercent;
          }

          if (itemDetail && "Storefront" in itemDetail) {
            if (itemDetail.Storefront && "StoreURL" in itemDetail.Storefront)
              itemDetailDictionary["itemStoreURL"] = itemDetail.Storefront.StoreURL;

            if (itemDetail.Storefront && "StoreName" in itemDetail.Storefront)
              itemDetailDictionary["itemStoreName"] = itemDetail.Storefront.StoreName;
          }

          if(itemDetailsResponse && "similarItems" in itemDetailsResponse && 
            itemDetailsResponse.similarItems && "getSimilarItemsResponse" in itemDetailsResponse.similarItems && 
            itemDetailsResponse.similarItems.getSimilarItemsResponse && 
            "itemRecommendations" in itemDetailsResponse.similarItems.getSimilarItemsResponse && 
            itemDetailsResponse.similarItems.getSimilarItemsResponse.itemRecommendations && 
            "item" in itemDetailsResponse.similarItems.getSimilarItemsResponse.itemRecommendations){

            
              var similarItemsArray = itemDetailsResponse.similarItems.getSimilarItemsResponse.itemRecommendations.item ; 

              var similarItemsDictionaryArray: any = [];
              var similarItemsDictionary: any = {};
      
              similarItemsArray.forEach((similarItem:any, index: any) => {
                similarItemsDictionary = {}

                similarItemsDictionary.itemIndex = index;
                similarItemsDictionary.itemTitle = similarItem.title;
                similarItemsDictionary.itemImageURL = similarItem.imageURL;
                similarItemsDictionary.itemPrice = similarItem.buyItNowPrice.__value__;
                similarItemsDictionary.itemShippingCost = similarItem.shippingCost.__value__;

                var daysLeft = moment.duration(similarItem.timeLeft).days()
                similarItemsDictionary.itemDaysLeft = daysLeft;

                similarItemsDictionaryArray.push(similarItemsDictionary);
              });
      
              itemDetailDictionary["similarItems"] = similarItemsDictionaryArray;
              itemDetailDictionary["similarItemsCount"] = similarItemsDictionaryArray.length <= 5 ? similarItemsDictionaryArray.length : 5;
          } 

          this.lastViewedWishListItem = itemDetailDictionary;
          this.showWishListItemDetails = true
          this.showWishListItems = true
          this.showResultItemDetails = false;
        }
      }
    });
  }


  toggleResultPills() {
    this.showWishListItems = false; 
    this.showResultItemDetails = false;
  }

  toggleWishListPills() {
    this.showWishListItems = true; 
    this.showResultItemDetails = false;
  }

  clearProductSearchForm (productSearchForm: NgForm) {
    productSearchForm.reset({
      keywords: "",
      categoryType: "All Categories",
      newCondition: false,
      usedCondition: false,
      unspecifiedCondition: false,
      localShipping: false,
      freeShipping: false,
      distance: 10,
      location: "currentLocationZipcode",
      userInputZipcode: ""
    });

    this.categoryType="All Categories";
    this.newCondition=false;
    this.usedCondition=false;
    this.unspecifiedCondition=false;
    this.localShipping=false;
    this.freeShipping=false;
    this.distance=10;
    this.location="currentLocationZipcode";
    this.userInputZipcode="";   

    this.currentPageNumber = 1;
    this.showWishListItems = false;
    this.searchResultItems = null;
    this.showResultItemDetails = false;
    this.resultsProgressBarLoading = false;
    this.resetSortingPreference();
  }

  navigateToPreviousPage() {
    window.scrollTo({
      top: 0
    });

    if (1 < this.currentPageNumber) 
      this.currentPageNumber = this.currentPageNumber - 1;
  }


  removeFromWishList(itemID: number, fromWishListSection? : boolean)
  {

    var removeFromWishListSearchQuery = "https://csci571-assi3-nikhal-backend.uc.r.appspot.com/modifyWishList/?" + "id=" + String(itemID) + "&operation=deleteFromWishList";

    this.wishListItemIDs = this.wishListItemIDs.filter((item_id: any) => item_id !== itemID);

    if (fromWishListSection == undefined) {
      if (this.lastViewedWishListItem && itemID == this.lastViewedWishListItem.itemID) {
        this.lastViewedWishListItem = null;
        this.lastViewedWishListDetailButton = false
      }
    }

    if (fromWishListSection == true) {
      this.lastViewedWishListDetailButton = false
    }
    
    this.http.get(removeFromWishListSearchQuery, {})
    .subscribe((itemDetailsResponse: any) => {
      this.wishListResponse = itemDetailsResponse;
      this.retrieveWishListItems(true, true)
    });
  }

  
  getSortingCriteria(displayCriteria: string): (parameter1: any, parameter2: any) => number {
    
    if (displayCriteria == "Default") {
      return this.indexComparisonSort;
    } else if (displayCriteria == "Product Name") {
      return this.titleComparisonSort;
    } else if (displayCriteria == "Days Left") {
      return this.daysLeftComparisonSort;
    } else if (displayCriteria == "Price") {
      return this.priceComparisonSort;
    } else if (displayCriteria == "Shipping Cost") {
      return this.shippingPriceComparisonSort;
    } else{
      return this.indexComparisonSort;
    }
  }

  indexComparisonSort(parameter1: any, parameter2: any): any {
    var index1 = parameter1.itemIndex;
    var index2 = parameter2.itemIndex;
    var computedSortingOrder = index1 - index2;
    return computedSortingOrder;
  }

  titleComparisonSort(parameter1: any, parameter2: any): any {
    var title1 = parameter1.itemTitle;
    var title2 = parameter2.itemTitle;
    var computedSortingOrder = title1.localeCompare(title2);
    return computedSortingOrder;
  }

  daysLeftComparisonSort(parameter1: any, parameter2: any): any {
    var days1 = parameter1.itemDaysLeft;
    var days2 = parameter2.itemDaysLeft;
    var computedSortingOrder = days1 - days2;
    return computedSortingOrder;
  }

  priceComparisonSort(parameter1: any, parameter2: any): any {
    var price1 = parameter1.itemPrice;
    var price2 = parameter2.itemPrice;
    var computedSortingOrder = price1 - price2;
    return computedSortingOrder;
  }

  shippingPriceComparisonSort(parameter1: any, parameter2: any): any {
    var shippingCost1 = parameter1.itemShippingCost
    var shippingCost2 = parameter2.itemShippingCost;
    var computedSortingOrder = shippingCost1 - shippingCost2;
    return computedSortingOrder;
  }

  performSimilarItemsSorting(displayCriteria: string, calledFromResult: boolean): void {
    const sortingCriteria = this.getSortingCriteria(displayCriteria);

    const compareFunction = (parameter1: any, parameter2: any) => {
      const sortingOrder = sortingCriteria(parameter1, parameter2);
      if (this.sortingPreference == "Ascending") {
        return sortingOrder
      } else {
        return -sortingOrder
      }
    };

    if (calledFromResult) {
      this.lastViewedResultItem.similarItems.sort(compareFunction);
    } else {
      this.lastViewedWishListItem.similarItems.sort(compareFunction);
    }
  }

    
  navigateToNextPage() {
    window.scrollTo({
      top: 0
    });

    if (this.currentPageNumber < this.currentPageSize) 
      this.currentPageNumber = this.currentPageNumber + 1;
  }

  addToWishList(itemID: number) {

    var addToWishListSearchQuery = "https://csci571-assi3-nikhal-backend.uc.r.appspot.com/modifyWishList/?" + "id=" + String(itemID) + "&operation=addToWishList";
    this.wishListItemIDs.push(itemID)

    this.http.get(addToWishListSearchQuery, {})
    .subscribe((itemDetailsResponse: any) => {
      this.wishListResponse = itemDetailsResponse
      this.retrieveWishListItems(true, true)
    });
  }

  resetSortingPreference () {
    this.displayCriteria = "Default";
    this.sortingPreference = "Ascending";
  }

  shortenTitle(itemTitle: string): string {
    if (itemTitle.length > 35) {
      var spaceIndex = itemTitle.substring(0, 36).lastIndexOf(" ");
      var finalTitleString = itemTitle.substring(0, spaceIndex) + "...";
      return finalTitleString;
    } else {
      return itemTitle;
    }
  }

  navigatePageNumber(currentPageNumber: number) {
   
    window.scrollTo({
      top: 0
    });

    if (currentPageNumber >= 1 && currentPageNumber <= this.currentPageSize) 
      this.currentPageNumber = currentPageNumber;
  }
}
