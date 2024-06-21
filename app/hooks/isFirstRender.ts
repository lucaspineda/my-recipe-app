import {useEffect, useRef} from 'react'
export function useIsFirstRender(): boolean {

  // your code here
  let isFirstRender = useRef(true)

  if (isFirstRender.current) {
    isFirstRender.current = false
    return true
  }

  return false

}