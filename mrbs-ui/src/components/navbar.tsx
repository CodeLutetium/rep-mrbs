import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Link } from "react-router-dom"

export default function Navbar() {
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
