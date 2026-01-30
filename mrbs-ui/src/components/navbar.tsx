import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { useUser } from "@/context/user-context"
import { Link } from "react-router-dom"

export default function Navbar() {
    const user = useUser();
    return (
        <div className="min-h-16  sticky min-w-full flex items-center justify-between">
            <div className="flex flex-col font-semibold text-primary ">
                <div>
                    North Hill REP
                </div>
                <div>
                    Meeting Room Booking System
                </div>
            </div>

            {user.user?.display_name}
            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem >
                        <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link to={"/login"}>Login</Link>} />
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>


        </div>
    )
}
