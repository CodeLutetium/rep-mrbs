import {
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import { useState } from "react"
import { insertUsers } from "@/services/user-service"
import { toast } from "sonner"


export default function AddUsersForm({ onSubmit }: { onSubmit: () => void }) {
    const [rawUsers, setRawUsers] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleSubmit() {
        if (!rawUsers.trim()) return

        setIsLoading(true)
        setError("")

        try {
            // Use your service here
            const res = await insertUsers(rawUsers)

            // Since validateStatus < 501, we need to check for success 2xx
            if (res.status >= 200 && res.status < 300) {
                toast.success(res.data.message)
                setRawUsers("") // Clear form
                onSubmit()      // Notify parent to close/refresh
            } else {
                // Handle 4xx or 500 errors gracefully
                setError(`Error: ${res.data?.message || "Failed to add users"}`)
            }
        } catch (err) {
            console.error(err)
            setError("Network error. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Onboard new users</DialogTitle>
                <DialogDescription>
                    Create new users with the default password.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="users">
                        User List (Format: #NAME# email)
                    </Label>
                    <Textarea
                        id="users"
                        value={rawUsers}
                        onChange={(e) => setRawUsers(e.target.value)}
                        placeholder={`#KOH MINGYANG# mkoh028@e.ntu.edu.sg\n#JOHN DOE# john@e.ntu.edu.sg`}
                        className="min-h-50 "
                    />
                    {error && (
                        <p className="text-sm font-medium text-destructive">
                            {error}
                        </p>
                    )}
                </div>
            </div>

            <DialogFooter>
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !rawUsers.trim()}
                >
                    {isLoading &&
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    }
                    {isLoading ? "Saving..." : "Save changes"}
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}
