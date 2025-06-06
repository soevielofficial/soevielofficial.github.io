'use client'
import React from "react";
import Image from 'next/image'
import SocialMedia from '@/components/SocialMedia';
import ProfilePicture from '@/components/ProfilePicture';
import { Inria_Sans } from 'next/font/google';
import { UseReposData } from '@/utilities/UseReposData';
import { ResearchModal } from '@/components/ResearchModal';
import { UseServerData } from '@/utilities/UseServerData';
import { UseCurrentTime } from '@/utilities/UseCurrentTime';
import { UseResearchModal } from '@/utilities/UseResearchModal';
import { STEAM_WORKSHOP_ITEMS } from '@/utilities/SteamWorkshopItems';
import { motion, AnimatePresence } from 'framer-motion';
import { ServerSkeletonLoader, RepoSkeletonLoader } from '@/components/LoadingComponents';

const inriaSans = Inria_Sans({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export default function Home() {
  const { serverData: tofServerData, loading: serverLoading, error: serverError } = UseServerData();
  const { selectedResearch, openResearchModal, closeResearchModal, researchItems: INTERESTING_STUFF } = UseResearchModal();
  const { currentRepo, loading: reposLoading, error: reposError, currentRepoIndex, setCurrentRepoIndex, repositories } = UseReposData();
  const [currentWorkshopIndex, setCurrentWorkshopIndex] = React.useState(0);
  const currentTime = UseCurrentTime();

  return (
    <div className={`relative h-screen w-screen overflow-hidden ${inriaSans.className}`}>
      {/* Background Video */}
      <video suppressHydrationWarning autoPlay loop muted playsInline className="absolute z-0 w-full h-full object-cover blur-sm scale-120">
        <source src="/background/bg.mp4" type="video/mp4"/>
      </video>
      
      {/* Content */}
      <div className="absolute z-10 w-full h-full flex flex-col items-center justify-center p-8 gap-8 overflow-y-auto">
        {/* Top Row - Profile and Server Info Side by Side */}
        <div className="w-full max-w-8xl flex flex-col md:flex-row gap-8">
          {/* Profile Box */}
          <div className="w-full md:w-1/3 h-[400px] rounded-3xl bg-black/75 backdrop-blur-md transition-all duration-500 hover:bg-black/80 hover:backdrop-blur-lg relative">
            {/* Time Display */}
            <div suppressHydrationWarning className="absolute top-4 left-4 text-white/70 text-sm">
              {currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            
            <div className="relative z-20 h-full flex flex-col items-center justify-center p-8 gap-4 text-center">
              <ProfilePicture src="/profile.gif" alt="User animation" size={96} unoptimized/>
              <h2 className="text-2xl font-bold text-white">soevielofficial</h2>
              <p className="text-white/80 text-sm">
                Welcome to my personal page! Here you can find information about my projects, interesting stuff and more.
              </p>
              <SocialMedia 
                Github="https://github.com/soevielofficial" 
                Discord="https://discord.com/users/442224069899976707" 
                EmailAddress="mailto:soevielofficial@gmail.com" 
                discordUserId="442224069899976707"
                className="my-4"
                IconSize={32} 
              />
            </div> 
          </div>

          {/* Server Info Box */}
          <div className="w-full md:w-2/3 h-[400px] rounded-3xl bg-black/75 backdrop-blur-md transition-all duration-500 hover:bg-black/80 hover:backdrop-blur-lg overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white">Tower of Fantasy Server Information</h2>
                <p className="text-white/80 mt-2 text-sm">
                  Server location details and network information including IP addresses, hostnames, and geographical data.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {serverLoading ? (
                  <ServerSkeletonLoader />
                ) : serverError ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-red-400 text-xl">Error: {serverError}</div>
                  </div>
                ) : tofServerData ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">OS Servers:</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(tofServerData.os).map(([region, data]) => (
                          <div key={region} className="bg-white/5 p-3 rounded-lg">
                            <h4 className="font-semibold text-blue-300 text-lg">{region}</h4>
                            <p className="text-sm text-white/70">{data.Country}, {data.City}</p>
                            <p className="text-sm font-mono text-white/50 mt-1">IP: {data["IP Address"]}</p>
                            <p className="text-sm font-mono text-white/50">Hostname: {data["Hostname"]}</p>
                            <p className="text-sm font-mono text-white/50">ISP: {data["ISP"]}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">CN Servers:</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(tofServerData.cn).map(([region, data]) => (
                          <div key={region} className="bg-white/5 p-3 rounded-lg">
                            <h4 className="font-semibold text-blue-300 text-lg">{region}</h4>
                            <p className="text-sm text-white/70">{data.Country}, {data.City}</p>
                            <p className="text-sm font-mono text-white/50 mt-1">IP: {data["IP Address"]}</p>
                            <p className="text-sm font-mono text-white/50">Hostname: {data["Hostname"]}</p>
                            <p className="text-sm font-mono text-white/50">ISP: {data["ISP"]}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-white/70 text-center py-8">No server data available</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Three Equal Columns */}
        <div className="w-full max-w-8xl flex flex-col md:flex-row gap-8">
          {/* Steam Workshop Box */}
          <div className="w-full md:w-1/3 h-[400px] rounded-3xl bg-black/75 backdrop-blur-md transition-all duration-500 hover:bg-black/80 hover:backdrop-blur-lg overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white">Left 4 Dead 2 Workshop</h2>
                <p className="text-white/80 mt-2 text-sm">
                  My Steam Workshop creations for Left 4 Dead 2.
                </p>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <AnimatePresence>
                  <motion.div
                    key={currentWorkshopIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 p-4"
                  >
                    {STEAM_WORKSHOP_ITEMS[currentWorkshopIndex] && (
                      <div className="h-full flex flex-col">
                        <div className="flex gap-4 mb-4">
                          <div className="flex-shrink-0 w-32 h-32 bg-gray-700 rounded-lg overflow-hidden">
                            <Image
                              src={STEAM_WORKSHOP_ITEMS[currentWorkshopIndex].image}
                              alt={STEAM_WORKSHOP_ITEMS[currentWorkshopIndex].title}
                              width={512}
                              height={384}
                              className="w-full h-full object-cover scale-75"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/steamworkshop/ak47-theempress.png';
                              }}
                              unoptimized
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-white">
                              <a 
                                href={STEAM_WORKSHOP_ITEMS[currentWorkshopIndex].url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="hover:underline"
                              >
                                {STEAM_WORKSHOP_ITEMS[currentWorkshopIndex].title}
                              </a>
                            </h3>
                          </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                          {/* Additional content if needed */}
                          <p className="text-sm text-white/80">
                            {STEAM_WORKSHOP_ITEMS[currentWorkshopIndex].description || 
                            "More details about this workshop item..."}
                          </p>
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center">
                          <button 
                            onClick={() => setCurrentWorkshopIndex(prev => 
                              (prev - 1 + STEAM_WORKSHOP_ITEMS.length) % STEAM_WORKSHOP_ITEMS.length)}
                            className="px-3 py-1 bg-white/10 rounded hover:bg-white/20 transition"
                          >
                            Previous
                          </button>
                          
                          <span className="text-sm text-white/50">
                            {currentWorkshopIndex + 1} / {STEAM_WORKSHOP_ITEMS.length}
                          </span>
                          
                          <button 
                            onClick={() => setCurrentWorkshopIndex(prev => 
                              (prev + 1) % STEAM_WORKSHOP_ITEMS.length)}
                            className="px-3 py-1 bg-white/10 rounded hover:bg-white/20 transition"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Interesting Stuff Box */}
          <div className="w-full md:w-1/2 h-[400px] rounded-3xl bg-black/75 backdrop-blur-md transition-all duration-500 hover:bg-black/80 hover:backdrop-blur-lg overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white">Interesting Stuff</h2>
                <p className="text-white/80 mt-2 text-sm">
                  Something interesting discovery and random things that is on the internet.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, staggerChildren: 0.1 }}
                    className="space-y-4"
                  >
                    {INTERESTING_STUFF.map((item, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition cursor-pointer"
                        onClick={() => openResearchModal(index)}
                      >
                        <h3 className="font-bold text-white">{item.title}</h3>
                        <div className="flex items-center text-xs text-white/50 mt-1">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          {item.date}
                        </div>
                        <p className="text-sm text-white/70 mt-2">{item.summary}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="text-xs px-2 py-1 bg-blue-900/50 rounded-full text-blue-300">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* GitHub Repositories Box */}
          <div className="w-full md:w-1/3 h-[400px] rounded-3xl bg-black/75 backdrop-blur-md transition-all duration-500 hover:bg-black/80 hover:backdrop-blur-lg overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white">GitHub Repositories</h2>
                <p className="text-white/80 mt-2 text-sm">
                  My open-source projects and contributions on GitHub.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 overflow-x-hidden">
                {reposLoading ? (
                  <RepoSkeletonLoader />
                ) : reposError ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-red-400 text-xl">Error: {reposError}</div>
                  </div>
                ) : currentRepo ? (
                  <div className="space-y-6 h-full flex flex-col">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {repositories.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentRepoIndex(index)}
                            className={`w-3 h-3 rounded-full transition ${index === currentRepoIndex ? 'bg-white' : 'bg-white/30'}`}
                            aria-label={`Go to repository ${index + 1}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-white/50">
                        {currentRepoIndex + 1} of {repositories.length}
                      </span>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${repositories[currentRepoIndex].owner}/${repositories[currentRepoIndex].repo}`}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="bg-white/5 p-4 rounded-lg flex-1 flex flex-col"
                      >
                        <h3 className="text-xl font-semibold text-blue-400 mb-2">
                          <a 
                            href={currentRepo.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:underline"
                          >
                            {currentRepo.name}
                          </a>
                        </h3>
                        <p className="text-white/80 mb-4 flex-1">{currentRepo.description}</p>
                        
                        <div className="flex gap-4 text-sm mb-4 flex-wrap">
                          <span className="flex items-center text-white/70">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {currentRepo.stars} stars
                          </span>
                          <span className="flex items-center text-white/70">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                            </svg>
                            {currentRepo.forks} forks
                          </span>
                          <span className="flex items-center text-white/70">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            Last Update: {currentRepo.lastUpdated}
                          </span>
                        </div>
                        
                        <a 
                          href={currentRepo.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block px-4 py-2 bg-gray-700 rounded-lg font-bold hover:bg-gray-600 transition text-center mt-auto"
                        >
                          View on GitHub
                        </a>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-white/70 text-center py-8">No repository data available</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Research Modal */}
      {selectedResearch !== null && (
        <ResearchModal
          isOpen={selectedResearch !== null}
          onClose={closeResearchModal}
          title={INTERESTING_STUFF[selectedResearch].title}
          date={INTERESTING_STUFF[selectedResearch].date}
          content={INTERESTING_STUFF[selectedResearch].content}
          tags={INTERESTING_STUFF[selectedResearch].tags}
        />
      )}
    </div>
  );
}