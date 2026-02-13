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
import { LogOutIcon, KeyRound, ChevronDown, CircleQuestionMark, ShieldCheck } from "lucide-react";

export default function Navbar() {
    const user = useUser();

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
                            <NavigationMenuItem >
                                <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link to={"/"}>Home</Link>} />
                                <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link to={"/help"}>Help</Link>} />
                                <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link to={"/login"}>Login</Link>} />
                            </NavigationMenuItem>

                    }

                </NavigationMenuList>
            </NavigationMenu>


        </div>
    )
}
