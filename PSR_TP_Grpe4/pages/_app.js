import '@/styles/globals.css'
import { toast,ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';

export default function App({ Component, pageProps }) {
  return (
    <>
     <Component {...pageProps} />
     <ToastContainer/>
    </>
  )
}


