import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { toast,ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
import { io } from "socket.io-client";
import { useRef } from 'react';
import Link from 'next/link';

const Chat = () => {
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("")
  const [usernameR,setUsernameR]=useState("");
  const [passwordR,setPasswordR]=useState("")
  const [isLoggedIn,setIsLoggedIn]=useState(false)
  const [clients, setClients] = useState({});
  const [messageInput, setMessageInput] = useState('');
  const [activeLink,setActiveLink]=useState('group');
  const [user,setUser] =useState("")
  const [id,setId] =useState("")
  const [newUser,setNewUser] =useState("")
  const [socket, setSocket] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [activeUser, setActiveUser] = useState('');
  const [privateMessages, setPrivateMessages] = useState({});
  const [newprivateMessages, setNewPrivateMessages] = useState({});
  const [publicMessages, setPublicMessages] = useState([]); 
  const [unreadMessages, setUnreadMessages] = useState({});
  const [newunreadMessages, setNewUnreadMessages] = useState({});
  const [userSocket,setUserSocket]=useState({});
  
  const handleUserClick = (user) => {
    setActiveLink('private');
    setSelectedUser(user);
    setUnreadMessages((prevUnreadMessages) => ({
      ...prevUnreadMessages,
      [user.id]: 0,
    }));
  };
  
    useEffect(() => {
      if (selectedUser) {
        setActiveUser(selectedUser.id);
      }
    }, [selectedUser]);
    
    const broadcastMessage = ()=>{
      setActiveLink('broadcast');
      setSelectedUser(null);
    }
    const groupMessage = ()=>{
      setActiveLink('group');
      setSelectedUser(null);
    }
    const showAll= useRef(null);
    const showMenu = ()=>{
         showAll.current.classList.remove('hidden')
    }
    const couper = ()=>{
      showAll.current.classList.add('hidden')
 }
    const showAllSalon= useRef(null);
    const showMenuSalon = ()=>{
         showAllSalon.current.classList.remove('hidden')
    }
    const couperSalon = ()=>{
      showAllSalon.current.classList.add('hidden')
 }
  const [login,setLogin] = useState(true);
  const [Enregistrer,setEnregistrer] = useState(false);
  const handleChangeLogin = ()=>{
      if(!login)
      {
          setLogin(!login)
          setEnregistrer(!Enregistrer)
      }
  }
  const handleChangeEnregistrer = ()=>{
      if(!Enregistrer)
      {
          setLogin(!login)
          setEnregistrer(!Enregistrer)
      }
  }
  const sendPrivateMessage = (content, to) => {
    if (socket) {
      socket.emit('private message', { content, to });
    }
  };
  useEffect(() => {
    const newSocket = io("http://localhost:8000");
    setSocket(newSocket);
   
    return () => {
   
      newSocket.close();
    };
  }, [setSocket]);
  
  const sendMessage = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      if (socket && messageInput.trim() !== '') {
        socket.emit('public message', messageInput);
        setMessageInput('');
      }
    } else {
      if (socket && messageInput.trim() !== '') {
        const privateMessageData = {
          content: messageInput,
          to: selectedUser.userId,
          type: 'sent',
        };
        sendPrivateMessage(messageInput, selectedUser.userId);

        // Mettre à jour les messages privés de l'émetteur
        setPrivateMessages((prevPrivateMessages) => ({
          ...prevPrivateMessages,
          [selectedUser.userId]: [
            ...(prevPrivateMessages[selectedUser.userId] || []),
            { content: messageInput, type: 'sent' },
          ],
        })); 
        setMessageInput('');
      }
    }
  };

const handleLogin=(e)=>{
  e.preventDefault();
  if(socket && username.trim() !== '' && password.trim() !==''){
    socket.emit('login',{username, password});
  }
};
const handleEnregistrer=(e)=>{
  e.preventDefault();
  if(socket && usernameR.trim() !== '' && passwordR.trim() !==''){
    socket.emit('Enregistrer',{usernameR, passwordR});
  }
};

  useEffect(() => {
    if (socket) {
      socket.on("login_successful", (data) => {
        setIsLoggedIn(true)
        setUsername("")
        setPassword("")
        setUser(data.username);
      });
      socket.on("login_failed", (data) => {
        toast.error('error login');
      });

      socket.on("registration_successful", (data) => {
        setUsernameR("")
        setPasswordR("")
        toast.success(
          data.usernameR + " is registrated \n" + "With ID :" + data.id,{
            position: toast.POSITION.TOP_CENTER
          });
 
      });
      socket.on("registration_failed", (message) => {
        // setError(message);
         toast.error("Error while registration !");
      });
    
      socket.emit('updated connectedUsers')

      socket.on('reponse',(client)=>{
        setClients(client);
      })

      socket.on('your id', (id) => {
        setId(id);
      })
      socket.on('userSock',(userSocket)=>{
        setUserSocket(userSocket);
        console.log('userSockets:',userSocket)
      })
      console.log('setuserSockets:',userSocket)
      socket.on('new private message', (message) => {
        console.log('Received private message:', message);
         if (message.to !== clients.userId) {
          // Mettre à jour les messages privés du récepteur
          setNewPrivateMessages((prevPrivateMessages) => ({
            ...prevPrivateMessages,
            [message.to]: [
              ...(prevPrivateMessages[message.to] || []),
              { content: message.content, type: message.type },
            ],
          }));
  
          // Mettre à jour les messages non lus chez le récepteur
          setNewUnreadMessages((prevUnreadMessages) => ({
            ...prevUnreadMessages,
            [message.from]: (prevUnreadMessages[message.from] || 0) + 1,
          }));
        }
        console.log('private:',privateMessages);
        console.log('unread:',unreadMessages);
      });
    
      socket.on('public message', (message) => {
        setPublicMessages((previousSMS)=>[...previousSMS,message.content])
      });
      socket.on("reconnect_successful", () => {
       alert("Reconnected to the server");
      });

      return () => { 
        socket.disconnect();
      };
    }
  }, [socket]);

  useEffect(() => {
    if(newprivateMessages){
      setPrivateMessages(newprivateMessages);
      console.log('newprivate:', privateMessages);
    }
    if(newunreadMessages){
      setUnreadMessages(newunreadMessages);
      console.log('newunread:', unreadMessages);
    }
  }, [newprivateMessages, newunreadMessages]);
  
    
  useEffect(() => {
    if(user){
      setNewUser(user);
    }
  }, [user]);
  
    return (
    <div className='bg-gray-200  min-h-screen min-w-max '>
      {
        isLoggedIn?(
          <>
        <header className="bg-blue-100 p-4 border-b-2 border-purple-600 shadow-lg">
          <div className='grid grid-cols-2 w-full'>
              <div className="w-1/2">
                  <Image width={50} height={50}
                  src="/photos/photo4.jpeg"
                  alt=""
                  className="h-12 rounded-full mr-4 shadow-md"
                  />
                  <h2 className="text-lg font-semibold font-serif text-purple-700">{newUser}</h2>
              </div>
              <div className=" flex justify-center ">
              <h1 className="text-3xl md:text-4xl font-extrabold font-serif text-green-400">Chat App</h1>
              </div>
          </div>
        </header>
      <div className="flex min-h-screen ">
        <div className=" bg-gray-100 p-4 w-[1/4] mt-0 h-auto relative">
          <input
            type="text"
            className="border rounded-lg px-4 py-2 w-full outline-none focus:ring-1 ring-blue-600"
            placeholder="Rechercher un utilisateur"
          />
          <div className=' bg-blue-100 flex justify-end mt-4 visible lg:hidden rounded-lg'>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10 text-purple-900" ref={showAll} onClick={showMenu}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
          </div>
          <div className='hidden bg-green-200 lg:grid grid-cols-3 h-auto absolute lg:relative right-4 lg:right-0 top-18 lg:my-3 rounded-lg pb-3' ref={showAll}>
              <div className='flex justify-end visible lg:hidden' onClick={couper}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-8 text-red-500 font-bold font-serif">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className='w-[1/2] h-full pl-0 sm:pl-2'>
                <Link href="" className={`text-xl lg:text-2xl font-bold font-serif ${activeLink === 'private' ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'}`}>Private</Link>
              </div>
              <div className='w-[1/2] pl-0 sm:pl-2 border-t-2 lg:border-l-2 lg:border-t-0'>
                <Link href="" className={`text-xl lg:text-2xl font-bold font-serif ${activeLink === 'group' ? 'text-blue-700' : 'text-gray-700 hover:text-blue-700'}`}>Group</Link>
              </div>
              <div className='w-[1/2] pl-0 sm:pl-2 border-t-2 lg:border-l-2 lg:border-t-0'>
                <Link href="" className={`text-xl lg:text-2xl font-bold font-serif ${activeLink === 'broadcast' ? 'text-blue-700' : 'text-gray-700 hover:text-blue-700'}`} onClick={broadcastMessage}>Broadcast</Link>
              </div>
          </div>

          <ul className="mt-4">
            {clients.map((client, index) => (
              (user!==client.username)?(
                <>
                <li
                key={index}
                className={`flex items-center mb-2 cursor-pointer ${
                  user.newMessages > 0 ? 'font-bold' : ''
                }`}
                onClick={() => handleUserClick(client)}
              >
                <Image width={50} height={50}
                  src={user.profilePicture}
                  alt=""
                  className="w-8 h-8 rounded-full mr-2 shadow-md"
                />
                <span className=" flex-1">{client.username}</span>
                <span className="bg-red-500 text-white font-serif px-2 rounded-full">{unreadMessages[client.socketId]} </span>
                {unreadMessages[client.socketID] > 0 && (
                  <span className="bg-red-500 text-white font-serif px-2 rounded-full">
                   {unreadMessages[client.socketId]} 
                  </span>
                )}
              </li>
              </>
              ):('')
            ))}
          </ul>
        </div>
        <div className="flex-1 p-3 bg-gray-200 relative">
          <div className=' bg-blue-100 flex justify-end mb-4 mt-2 visible lg:hidden rounded-lg '>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10 text-purple-900" ref = {showAllSalon} onClick={showMenuSalon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
          </div>
          <div className='hidden bg-green-200 lg:grid grid-cols-3 h-auto absolute lg:relative right-3 lg:right-0 top-[3.75rem] lg:top-0 lg:my-3 rounded-lg pb-3 lg:pb-0' ref={showAllSalon}>
          <div className='flex justify-end visible lg:hidden' onClick={couperSalon}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-8 text-red-500 font-bold font-serif">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className='w-[1/2] h-full pl-0 sm:pl-2'>
            <Link href="" className={`text-xl lg:text-2xl font-bold font-serif ${activeLink === 'broadcast' ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'}`} onClick={broadcastMessage}>Broadcast</Link>
          </div>
          <div className='w-[1/2] pl-0 sm:pl-2 border-t-2 lg:border-l-2 lg:border-t-0'>
            <Link href="" className={`text-xl lg:text-2xl font-bold font-serif ${activeLink === 'private' ? 'text-blue-700' : 'text-gray-700 hover:text-blue-700'}`}>Private</Link>
          </div>
          <div className='w-[1/2] pl-0 sm:pl-2 border-t-2 lg:border-l-2 lg:border-t-0'>
            <Link href="" className={`text-xl lg:text-2xl font-bold font-serif ${activeLink === 'group' ? 'text-blue-700' : 'text-gray-700 hover:text-blue-700'}` } onClick={groupMessage }>Group</Link>
          </div>
        </div>

          {selectedUser ? (
          <div className="bg-white rounded-lg p-2 sm:p-4 mb-4">
            <Image
              width={50}
              height={50}
              src={selectedUser.profilePicture}
              alt=""
              className="w-12 h-12 rounded-full mr-4 shadow-md"
            />
            <h2 className="text-lg font-semibold mb-2">
              {selectedUser.username}
            </h2>
            {privateMessages[selectedUser.userId] && privateMessages[selectedUser.userId].map((mess, index) => (
             <div
             key={index}
             className={mess.type === 'sent' ? 'bg-blue-100 text-black w-[1/2] p-2 rounded-bl-3xl rounded-tl-3xl rounded-tr-xl mb-2 mr-[50%] flex justify-start' : 'bg-blue-300 text-white p-2 w-[1/2] flex justify-end ml-[50%] rounded-bl-3xl rounded-tl-3xl rounded-tr-xl mb-2'}
           >
            {mess.content}
           </div>
            ))}
          </div>
        ) : (
          publicMessages.map((message, index) => (
            <div
            key={index}
            className=
            //   `${
            //   message.type === 'received'
            //     ? 'bg-blue-500 text-white'
            //     : 'bg-blue-100 text-black'
            // }
            " bg-blue-500 text-white p-2 rounded-bl-3xl rounded-tl-3xl rounded-tr-xl mb-2"
          >
           {message}
          </div>
          ))
        )}
          <form className="bg-white rounded-lg p-2 sm:p-4" onSubmit={sendMessage}>
            <input
              type="text"
              className="appearance-none block rounded-bl-3xl rounded-tl-3xl rounded-tr-xl border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm px-4 py-2 w-full "
              placeholder="Entrez votre message"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
            />
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-2 hover:bg-blue-800"   onClick={sendMessage} type="submit">
              Send
            </button>
          </form>
        </div>
      </div>
          </>

        ):(
          <>
          <div className="flex justify-center bg-blue-100 py-4 border-b-2 border-purple-600 shadow-lg f-full" >
              <h1 className="text-4xl font-extrabold font-serif text-green-400  ">Chat App</h1>
          </div>
          <div className='flex justify-center mt-4'>
            <div className='border-2 border-purple-600 w-auto rounded-2xl shadow-lg h-auto'>
            <div className='flex justify-center p-1 sm:p-4 bg-gray-50 rounded-t-2xl'>
            <div className='flex justify-center p-1 sm:p-4 bg-gray-50 rounded-t-2xl'>
                <button
                  onClick={handleChangeLogin}
                  className={`text-center text-3xl font-bold font-serif border rounded-md p-2 border-purple-800 ${
                    login
                      ? 'text-purple-600 bg-purple-100'
                      : 'text-blue-500 hover:text-purple-300'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={handleChangeEnregistrer}
                  className={`text-center text-3xl font-bold font-serif border rounded-md p-2 border-purple-800 ml-4 ${
                    Enregistrer
                      ? 'text-purple-600 bg-purple-100'
                      : 'text-blue-500 hover:text-purple-300'
                  }`}
                >
                  Enregistrer
                </button>
            </div>

</div>

          {
              login? (
                <>
                <div className="flex items-center justify-center bg-gray-50  py-12 px-4 sm:px-6 lg:px-8 rounded-b-2xl ">
                  <div className="max-w-md w-full space-y-8">
                  <div className='w-auto'>
                       <div className="relative w-[250px] sm:w-[350px] h-[160px] sm:h-[250px]">
                        <img src="/photos/login.jpg" alt='' className="absolute inset-0 w-full h-full object-cover">
                        </img>
                      </div>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                      <div>
                        <label htmlFor="username" className="block text-sm font-medium text-purple-600">
                          Username
                        </label>
                        <input
                          id="username"
                          name="username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          autoComplete="username"
                          required
                          className="mt-1 p-2 appearance-none block w-full rounded-md border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-purple-700">
                          Password
                        </label>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                          required
                          className="mt-1 p-2 appearance-none block w-full rounded-md border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <button
                          type="submit"
                          onClick={handleLogin}
                          className="group relative w-full flex justify-center py-2 px-4 border border-transparent font-semibold font-serif rounded-md text-white bg-blue-500 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Login
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
                </> 
              ):('')
          }
          {
              Enregistrer? (
                <>
                <div className="flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 rounded-b-2xl ">
                  <div className="max-w-md w-full space-y-8">
                    <div className='w-auto'>
                       <div className="relative w-[250px] sm:w-[350px] h-[160px] sm:h-[250px]">
                        <img src="/photos/Enregistrer.jpg" alt='' className="absolute inset-0 w-full h-full object-cover">
                        </img>
                      </div>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleEnregistrer}>
                      <div>
                        <label htmlFor="username" className="block text-sm font-medium text-purple-700">
                        Username
                        </label>
                        <input
                          id="username"
                          name="username"
                          type="text"
                          value={usernameR}
                          onChange={(e) => setUsernameR(e.target.value)}
                          autoComplete="username"
                          required
                          className="mt-1 p-2 appearance-none block w-full rounded-md border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-purple-700">
                          Password
                        </label>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          value={passwordR}
                          onChange={(e) => setPasswordR(e.target.value)}
                          autoComplete="current-password"
                          required
                          className="mt-1 p-2 appearance-none block w-full rounded-md border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <button
                          type="submit"
                          className="group relative w-full flex justify-center py-2 px-4 border border-transparent font-semibold font-serif rounded-md text-white bg-blue-500 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Create account
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
                </>
                
                ):('')
          }  
            </div>
          </div>
        </>
       )
      }
    </div>
  );
};

export default Chat;





















