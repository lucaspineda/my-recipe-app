'use client'

import React from 'react';
import { useClickOutside } from '../hooks/useClickOutside'; // Import the hook

function App() {
  const handleClickOutside = () => {
    console.log('chamouu')
    alert('Clicked outside the app!');
  };

  const ref = useClickOutside(handleClickOutside); // Call the hook

  return (
    <div ref={ref}>
      {/* Your other App content */}
      {/* Your custom content that should detect outside clicks */}
      This content will close when clicked outside the app.
    </div>
  );
}

export default App;