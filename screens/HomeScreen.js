import React, {Component} from 'react';
import { StyleSheet, View, Text, TextInput, TouchableHighlight, Keyboard } from 'react-native';
import MapView, {Polyline, Marker} from 'react-native-maps';
// import MapViewDirections from 'react-native-maps-directions';
import PolyLine from '@mapbox/polyline'
import {apiKey} from '../secrets';
import _ from 'lodash'


// const origin = {latitude: 40.7305, longitude: -73.9091};
// const destination = {latitude: 40.705, longitude: -74.009};

export default class HomeScreen extends Component {
  constructor(){
    super();
    this.state = {
      error: '',
      latitude: 40.6866676,
      longitude: -73.9836081,
      friend: '',
      friendCoords: {},
      predictions: []
    };
    this.onChangeDestinationDebounced = _.debounce(
      this.onChangeDestination, 1000
    )
  }
  
  componentDidMount(){
    navigator.geolocation.getCurrentPosition(
      position => {
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      error => alert(`${error.message} You're now in Brooklyn, the best!`), {enableHighAccuracy: false, maximumAge: 1000, timeout: 20000}
    )
  }
  async getTravelDuration(friendPlaceId, friendPlaceName) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${
          this.state.latitude
        },${
          this.state.longitude
        }|place_id:${friendPlaceId}&destinations=${
          this.state.latitude
        },${
          this.state.longitude
        }|place_id:${friendPlaceId}&mode=transit&transit_mode=subway&departure_time=now&key=${apiKey}`
      );
      const json = await response.json();
      // console.log(json);
      const friendDetails = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?placeid=${friendPlaceId}&key=${apiKey}`);
      const jsonFriend = await friendDetails.json()
      // const points = PolyLine.decode(json.routes[0].overview_polyline.points);
      const friendCoords = {latitude: jsonFriend.result.geometry.location.lat, longitude: jsonFriend.result.geometry.location.lng }
      console.log(friendCoords)
      this.setState({
        friendCoords,
        predictions: [],
        friend: friendPlaceName
      });
      Keyboard.dismiss();
      this.map.fitToCoordinates([{
        latitude: this.state.latitude,
        longitude: this.state.longitude
      }, friendCoords], { edgePadding: edgePadding});
    } catch (error) {
      console.error(error);
    }
  }
  async onChangeDestination(friend) {
    const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${apiKey}
    &input=${friend}&location=${this.state.latitude},${
      this.state.longitude
    }&radius=2000`;
    console.log(apiUrl);
    try {
      const result = await fetch(apiUrl);
      const json = await result.json();
      this.setState({
        predictions: json.predictions
      });
      console.log(json);
    } catch (err) {
      console.error(err);
    }
  }
  render() {
    // let originMarker = null;
    // if (this.state.longitude){
    //   originMarker = (
    //     <Marker color='tomato' coordinate={{longitude: this.state.longitude, latitude: this.state.latitude}} />
    //   )
    
    let marker = null;

    if (this.state.friendCoords.latitude){
      marker = (
        <Marker color='tomato' coordinate={this.state.friendCoords} />
      )}
  
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
          latitude: this.state.latitude,
          longitude: this.state.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121
        }}
        showsUserLocation={true}
      >
        {/* <Polyline
          coordinates={this.state.friendCoords}
          strokeWidth={4}
          strokeColor="plum"
        /> */}
    <Marker color='tomato' title='Me' coordinate={{longitude: this.state.longitude, latitude: this.state.latitude}} /> 
        {marker}
      </MapView>
      <TextInput
        placeholder="A fair friend is no fair-weather friend...meet in the middle!"
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
    marginTop: 50,
    marginLeft: 5,
    marginRight: 5,
    padding: 5,
    backgroundColor: "white"
  },
  suggestions: {
    backgroundColor: "white",
    padding: 5,
    fontSize: 18,
    borderWidth: 0.5,
    marginLeft: 5,
    marginRight: 5
  }
});