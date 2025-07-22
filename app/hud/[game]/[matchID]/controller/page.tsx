'use client';

import { useParams } from 'next/navigation';

const HudController = () => {
 const params = useParams();
 
   
   const game = params?.game as string;
   const matchID = params?.matchID as string;
 
   return (
     <div className="p-4 text-white bg-green-500">
       <h1 className="text-2xl font-bold">HUD UI</h1>
       <p>Game: {game}</p>
       <p>Match ID: {matchID}</p>
     </div>
   );
}

export default HudController