import React, {Component} from 'react';
import { StyleSheet, View, Image, Text, TextInput, Button, TouchableHighlight, Keyboard } from 'react-native';
import MapView, {Polyline, Marker, Callout} from 'react-native-maps';
// import MapViewDirections from 'react-native-maps-directions';
import PolyLine from '@mapbox/polyline'
import {apiKey} from '../secrets';
import _ from 'lodash'
import openMap from 'react-native-open-maps';

// const origin = {latitude: 40.7305, longitude: -73.9091};
// const destination = {latitude: 40.705, longitude: -74.009};

export default class HomeScreen extends Component {
  constructor(){
    super();
    this.state = {
      error: '',
      latitude: 40.6866676,
      longitude: -73.9836081,
      lat: 40.6866676,
      long: -73.9836081,
      friend: '',
      pointCoordsToFriend: [],
      pointCoordsToMe: [],
      pointCoords: [],
      travelTime: '',
      predictions: [],
      duration: '',
      placeInfo: {}
    };
    this.onChangeDestinationDebounced = _.debounce(
      this.onChangeDestination, 1000
    );
    this._navigate = this._navigate.bind(this)
  }
  
  componentDidMount(){
    navigator.geolocation.getCurrentPosition(
      position => {
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          lat: position.coords.latitude,
          long: position.coords.longitude,
        });
      },
      error => alert(`${error.message} You're now in Brooklyn, the best!`), {enableHighAccuracy: false, maximumAge: 1000, timeout: 20000}
    )
  }

  _navigate() {
    openMap({end: `${this.state.placeInfo.name} ${this.state.placeInfo.address}`, travelType: 'public_transit'});
  }
  async getRouteDirections(destinationPlaceId) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?&mode=transit&origin=${
          this.state.latitude
        },${
          this.state.longitude
        }&destination=place_id:${destinationPlaceId}&departure_time=now&transit_mode=subway&key=${apiKey}`
      );
      const json = await response.json();
      const travelTime = json.routes[0].legs[0].duration.text
      const points = PolyLine.decode(json.routes[0].overview_polyline.points);
      const pointCoords = points.map(point => {
        return { latitude: point[0], longitude: point[1] };
      });
      this.setState({
        travelTime,
        pointCoords
      });
      Keyboard.dismiss();
      this.map.fitToCoordinates(pointCoords);
    } catch (error) {
      console.error(error);
    }
  }
  calculateDuration(me, friend){
    const secondsMe = me.routes[0].legs[0].duration.value
    const secondsFriend = friend.routes[0].legs[0].duration.value
    const bestTime = Math.floor(((secondsMe + secondsFriend) / 4)/60 )
    if (bestTime === 0) return `This won't work. Your friend is unreachable!`
    const bestCase = `The best case scenario would find a route of ${bestTime} minutes between us!`
    const worstCase = `If it's taking you more than 60 minutes to reach each other, it's not worth it. Trust me.`
    return bestTime < 60 ? bestCase : worstCase;
  }

  async getTravelDuration(friendPlaceId, friendPlaceName) {
    try {
      const routeUrlFriend = `https://maps.googleapis.com/maps/api/directions/json?&mode=transit&origin=${
        this.state.latitude
      },${
        this.state.longitude
      }&destination=place_id:${friendPlaceId}&departure_time=now&transit_mode=subway&key=${apiKey}`
      console.log(routeUrlFriend)
      const routeToFriend = await fetch(routeUrlFriend);
      const friendRoute = await routeToFriend.json();
      const points = PolyLine.decode(friendRoute.routes[0].overview_polyline.points);
      const pointCoordsToFriend = points.map(point => {
        return { latitude: point[0], longitude: point[1] };
      });

      const routeToMe = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?&mode=transit&origin=place_id:${friendPlaceId}&destination=${
          this.state.latitude
        },${
          this.state.longitude
        }&departure_time=now&transit_mode=subway&key=${apiKey}`
      );
      const meRoute = await routeToMe.json();
      const pointsToMe = PolyLine.decode(meRoute.routes[0].overview_polyline.points);
      const pointCoordsToMe = pointsToMe.map(point => {
        return { latitude: point[0], longitude: point[1] };
      });
      console.log('MeCoords', pointCoordsToMe.length)
      console.log('FriendCoords', pointCoordsToFriend)
      const duration = this.calculateDuration(friendRoute, meRoute)
      this.setState({
        pointCoordsToFriend,
        pointCoordsToMe,
        predictions: [],
        friend: friendPlaceName,
        duration
      });
      Keyboard.dismiss();
      this.map.fitToCoordinates(pointCoordsToFriend, { edgePadding: edgePadding});
    } catch (error) {
      console.error(error);
    }
  }
  async onChangeDestination(friend) {
    const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${apiKey}
    &input=${friend}&location=${this.state.latitude},${
      this.state.longitude
    }&radius=2000`;
    try {
      const result = await fetch(apiUrl);
      const json = await result.json();
      this.setState({
        predictions: json.predictions
      });
    } catch (err) {
      console.error(err);
    }
  }

  async handlePoiClick(event){
    const placeUrl = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${event.placeId}&key=${apiKey}`
    try {
      const result = await fetch(placeUrl);
      const json = await result.json();
      
      const placeInfo = {
        name: event.name,
        icon: json.result.icon,
        price: json.result.price_level,
        address: json.result.formatted_address,
        rating: json.result.rating,
        url: json.result.url,
        coordinate: event.coordinate,
        id: event.placeId
      };
      this.setState({
        travelTime: '',
        placeInfo,
        lat: event.coordinate.latitude,
        long: event.coordinate.longitude
      })
      console.log(this.state.placeInfo)
    } catch(err) {
      console.error(err)
    }
    
  }
  render() {
    
    let marker = null;
    if (this.state.pointCoordsToFriend.length > 1){
      marker = (
        <Marker pinColor='plum' coordinate={this.state.pointCoordsToFriend[this.state.pointCoordsToFriend.length-1]} />
      )
    }
    let poiMarker = null;
    if (this.state.placeInfo.name) {
      poiMarker = (
      <Marker pinColor='green' 
      coordinate={this.state.placeInfo.coordinate} 
      calloutOffset={{ x: -8, y: 28 }}
      calloutAnchor={{ x: 0.5, y: 0.4 }}>
        <Callout style={styles.calloutView} onPress={() => this.getRouteDirections(this.state.placeInfo.id)}>
          <View>
            {/* <Image style={{width: 50, height: 50}} source={{uri: this.state.placeInfo.icon}} /> */}
              <Text style={styles.textCallout}> Meet up at: {this.state.placeInfo.name}</Text>
              <Text style={styles.textCallout}> Rating: {this.state.placeInfo.rating}/5 ✧ Price: {this.state.placeInfo.price}/4</Text>
              <Text style={styles.textCallout}> Click to preview route </Text>
          </View>
        </Callout>
      </Marker>
      )
    } 

      const predictions = this.state.predictions.map(prediction => (
      <TouchableHighlight
        onPress={() =>
          this.getTravelDuration(
            prediction.place_id,
            prediction.structured_formatting.main_text
          )
        }
        key={prediction.id}
        > 
          <Text style={styles.suggestions}>
            {prediction.structured_formatting.main_text}
          </Text>
    
      </TouchableHighlight>
    ));

  return (
    <View style={styles.container}>
      <MapView
        ref={map => {
          this.map = map;
        }}
        style={styles.map}
        customMapStyle={mapStyle}
        region={{
          latitude: this.state.lat,
          longitude: this.state.long,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121
        }}
        showsUserLocation={true}
        onPoiClick={e => this.handlePoiClick(e.nativeEvent)}
      >

    <Marker pinColor='red' title='Me' coordinate={{longitude: this.state.longitude, latitude: this.state.latitude}} /> 
        {marker}
        {poiMarker}
        
        <Polyline
          coordinates={this.state.pointCoordsToFriend}
          strokeWidth={5}
          strokeColor="plum"
        />
        <Polyline
          coordinates={this.state.pointCoordsToMe}
          strokeWidth={4}
          strokeColor="tomato"
        />
        <Polyline
          coordinates={this.state.pointCoords}
          strokeWidth={4}
          strokeColor="green"
        />
      </MapView>
      {this.state.duration !== '' ? <Text style={styles.textPlum}>{this.state.duration}</Text> : null}
      <TextInput
        placeholder="A fair friend is no fair-weather friend..."
        style={styles.destinationInput}
        value={this.state.friend}
        clearButtonMode="always"
        onChangeText={friend => {
          console.log(friend);
          this.setState({ friend });
          this.onChangeDestinationDebounced(friend);
        }}
      />
      {predictions}
      {this.state.travelTime.length > 1 ? 
            <View>
            <Button onPress={this._navigate} title="Click To Open Maps 🗺" />
            <Text style={styles.text}>Approx transit time: {this.state.travelTime}</Text>
            </View> : null}
    </View>
  );
  }
}

HomeScreen.navigationOptions = {
  title: `You are here! Where's your buddy?`,
};

const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.business",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "poi.business",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#009193"
      },
      {
        "visibility": "on"
      },
      {
        "weight": 2.5
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#dadada"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "on"
      },
      {
        "weight": 1
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "labels.text",
    "stylers": [
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "transit.station.rail",
    "elementType": "labels.text",
    "stylers": [
      {
        "color": "#ff2f92"
      },
      {
        "visibility": "on"
      },
      {
        "weight": 0.5
      }
    ]
  },
  {
    "featureType": "transit.station.rail",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#c9c9c9"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  }
]
const edgePadding = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50
}
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  destinationInput: {
    height: 40,
    borderWidth: 0.5,
    marginTop: 5,
    marginLeft: 5,
    marginRight: 5,
    padding: 5,
    backgroundColor: "rgba(255, 255, 255, 0.8)"
  },
  suggestions: {
    backgroundColor: "white",
    padding: 5,
    fontSize: 16,
    borderWidth: 0.5,
    marginLeft: 5,
    marginRight: 5
  },
  calloutView: {
    backgroundColor: "white",
    padding: 5,
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
    color: "tomato",
    marginLeft: 5
  },
  textCallout: {
    fontSize: 14,
    color: "#1AAC29",
    marginLeft: 5
  },
  textPlum: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff77ff",
    padding: 5,
    textAlign: "center",
    backgroundColor: "rgba(229, 229, 229, 0.4)"
  }
});