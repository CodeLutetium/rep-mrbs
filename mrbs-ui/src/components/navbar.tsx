import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { useUser } from "@/context/user-context"
import { Link, } from "react-router-dom"

export default function Navbar() {
    const user = useUser();

    return (
        <div className="min-h-16  sticky min-w-full flex items-center justify-between">
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
                            <NavigationMenuItem className="font-semibold text-primary">
                                {user.display_name}
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link to={"/logout"}>Logout</Link>} />
                            </NavigationMenuItem>
                        </div>
                        ) :
                            <NavigationMenuItem >
                                <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link to={"/login"}>Login</Link>} />
                            </NavigationMenuItem>

                    }

                </NavigationMenuList>
            </NavigationMenu>


        </div>
    )
}
