import {useState, useEffect} from 'react'

// export function useSWR<T = any, E = any>(
//   _key: string,
//   fetcher: () => T | Promise<T>
// ): {
//   data?: T;
//   error?: E;
// } {
//     const [data, setData] = useState(null);
//     const [error, setError] = useState(null);
//     const CBFetcher = fetcher()

//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const response = await CBFetcher
//                 setData(response)
//                 console.log('foi')
                
//             } catch (error) {
//                 setError(error)
                
//             }
//         }
//         fetchData()
//         return () => {};
//     }, []);

//     return {data, error}
//   // your code here
// }



export function useSWR<T = any, E = any>(
  _key: string,
  fetcher: () => T | Promise<T>
): {
  data?: T;
  error?: E;
} {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<E>();
  const fetcherResult = fetcher();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetcherResult;
        setData(response);
        console.log('foi')
      } catch (err) {
        setError(err);
      }
    };
    console.log('foi2')

    // if (fetcherResult instanceof Promise) {
      fetchData();
    // }
  }, []);

  const result = fetcherResult instanceof Promise ? data : fetcherResult;
  return { data: result, error };
}