// Conexión a Firebase Realtime Database: acá vive el estado compartido
// (bingo, ranking, etc.) para que varios celulares jueguen lo mismo en vivo.
const firebaseConfig = {
  apiKey: "AIzaSyBvNiRv5elK2VKWujGbNqJxe9gdoRcf4ug",
  authDomain: "bus-coin-fb008.firebaseapp.com",
  databaseURL: "https://bus-coin-fb008-default-rtdb.firebaseio.com",
  projectId: "bus-coin-fb008",
  storageBucket: "bus-coin-fb008.firebasestorage.app",
  messagingSenderId: "231640628702",
  appId: "1:231640628702:web:f753fc15a5057d052d714f",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Identifica este celular entre recargas, para saber qué asiento ya eligió.
function idDispositivo(){
  let id = localStorage.getItem('busmac-device-id');
  if(!id){
    id = 'dev-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('busmac-device-id', id);
  }
  return id;
}
