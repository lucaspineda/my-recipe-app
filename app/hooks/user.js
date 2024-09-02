// import { useEffect, useState } from 'react'
// import { initializeApp } from "firebase/app";
// import { getAuth, onAuthStateChanged } from "firebase/auth";

// const firebaseConfig = {
//   apiKey: "4",
//   authDomain: "recipe-app-1bbdc.firebaseapp.com",
// };
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);

// const useAuth = () => {
//   const [user, setUser] = useState(null);
//   console.log('here')

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged((user) => {
//       console.log('caiu aquii2', user)
//       setUser(user);
//     });

//     return () => {
//       unsubscribe();
//     };
//   }, []);

//   return user;
// };

// export default useAuth;
