import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { useUser } from "@/context/user-context"
import { Link, } from "react-router-dom"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { LogOutIcon, KeyRound, ChevronDown, CircleQuestionMark, ShieldCheck, ListPlus, Send } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const user = useUser();
  const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION;
  const [hasNewUpdate, setHasNewUpdate] = useState(false);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem("app_version");

    if (lastSeenVersion !== CURRENT_VERSION) {
      setHasNewUpdate(true);
    }
  }, [CURRENT_VERSION]);

  const handleViewUpdates = () => {
    localStorage.setItem("app_version", CURRENT_VERSION);
    setHasNewUpdate(false);
  };

  return (
    <div className="min-h-16 px-4  sticky min-w-full flex items-center justify-between">
      <Link className="flex flex-col font-semibold text-primary " to={"/"}  >
        <div>
          North Hill REP
        </div>
        <div>
          Meeting Room Booking System
        </div>
      </Link>

      <NavigationMenu>
        <NavigationMenuList>
          {/** Navbar for authenticated users */}
          {
            user ? (<div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <NavigationMenuItem className="group font-semibold text-primary cursor-pointer px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-1">
                    {user.display_name}
                    <ChevronDown className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </NavigationMenuItem>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className={"min-w-52 "}>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>My account</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link className="cursor-pointer" to={"/change-password"}>
                        <KeyRound />
                        Change password
                      </Link>
                    </DropdownMenuItem>
                    {
                      user.level > 1 &&
                      <DropdownMenuItem asChild>
                        <Link className="cursor-pointer" to={"/admin"}>
                          <ShieldCheck />
                          Admin panel
                        </Link>
                      </DropdownMenuItem>

                    }
                    <DropdownMenuItem asChild>
                      <Link className="group cursor-pointer flex items-center gap-2" to="/link-telegram">
                        <Send className="transition-transform duration-300 ease-in-out group-hover:rotate-12 group-hover:scale-110" />
                        <span>New: Link Telegram</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link className="cursor-pointer" to={"/whats-new"} onClick={handleViewUpdates}>
                        <ListPlus />
                        What's new?
                        {hasNewUpdate && (
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link className="cursor-pointer" to={"/help"}>
                        <CircleQuestionMark />
                        Help
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" asChild>
                      <Link className="cursor-pointer" to={"/logout"}>
                        <LogOutIcon />
                        Logout
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            ) :
              <NavigationMenuItem className={"flex flex-row"} >
                <NavigationMenuLink className={navigationMenuTriggerStyle() + " hidden sm:block"} render={<Link to={"/"}>Home</Link>} />
                <NavigationMenuLink className={navigationMenuTriggerStyle() + " hidden sm:block"} render={
                  <Link to={"/whats-new"} onClick={handleViewUpdates} className="relative flex items-center">
                    Changelog
                    {hasNewUpdate && (
                      <span className="absolute top-2 right-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </Link>} />
                <NavigationMenuLink className={navigationMenuTriggerStyle() + " hidden sm:block"} render={<Link to={"/help"}>Help</Link>} />
                <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link to={"/login"}>Login</Link>} />
              </NavigationMenuItem>

          }

        </NavigationMenuList>
      </NavigationMenu>


    </div>
  )
}
