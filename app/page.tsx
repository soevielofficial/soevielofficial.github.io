import ProfileCard from "@/components/ProfileCardComponent";
import ScrollButton from "@/components/ScrollButtonComponent";
import GameManagerDatabase from "@/components/GameManagerDatabaseComponent";

export default function Home() {
  return (<>
    <div id="first-section" className="relative h-screen w-screen overflow-hidden flex items-center justify-center snap-start">
      {/* <video suppressHydrationWarning autoPlay loop muted playsInline className="absolute z-0 w-full h-full object-cover blur-sm scale-125">
          <source src="/bg.mp4" type="video/mp4" />
        </video> */}
      <img src="/panorama/cs_office_png.png" className="absolute z-0 w-full h-full object-cover blur-sm scale-125" />
      <ProfileCard />
      <ScrollButton targetId="next-section" direction="down" />
    </div>

    <div id="next-section" className="relative h-screen w-screen overflow-hidden flex items-center justify-center snap-start">
      <video suppressHydrationWarning autoPlay loop muted playsInline className="absolute z-0 w-full h-full object-cover blur-sm scale-125">
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      <GameManagerDatabase />

      <ScrollButton targetId="first-section" direction="up" />
    </div>
  </>
  );
}