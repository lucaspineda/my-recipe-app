'use client'

import React, {useEffect} from 'react';
import { useClickOutside } from '../hooks/useClickOutside'; // Import the hook
import { useIsFirstRender } from '../hooks/isFirstRender'; // Import the hook
import { useSWR } from "../hooks/useSWR";


function App() {
  const testFRender = useIsFirstRender()
  console.log(testFRender, 'testFRender')
  const handleClickOutside = () => {
    console.log('chamouu')
    alert('Clicked outside the app!');
  };


  console.log('1111')

  const fetcher = () => ({ name: 'BFE.dev' })

  const useSWRConst = useSWR('key', fetcher)

  const ref = useClickOutside(handleClickOutside); // Call the hook

  useEffect(() => {
  console.log('2222')

  }, []);

  console.log('3333')


  return (
    <div ref={ref}>
      {/* Your other App content */}
      {/* Your custom content that should detect outside clicks */}
      This content will close when clicked outside the app.
    </div>
  );
}

export default App;