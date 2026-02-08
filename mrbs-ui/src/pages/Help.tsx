import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HelpItem {
    title: string;
    content: string;
}

const helpItems: Array<HelpItem> = [
    {
        title: "How do I login?",
        content: "You can login using your NTU username (first half of your email) or your NTU email. If this is your first login, use the default password. Please change your password after your first login."
    },
    {
        title: "What is the default password?",
        content: "The default password is the same as the old system.",
    },
    {
        title: "Why can't I delete/alter a booking?",
        content: "In order to delete or alter a booking, you must be logged in as the same person that made the booking. Contact one of the booking room administrators or the person who initially made the booking to have it deleted or changed.",
    },
    {
        title: "How do I create a booking?",
        content: "Clicking on the desired time brings you into the booking screen. Fill in the details and click \"Save\". ",
    },
]

export default function HelpPage() {
    return (
        <div className="flex h-full justify-center flex-col items-center  gap-6 p-6 md:p-10">
            <div className="flex max-w-2xl w-full flex-col gap-6">
                <div className="flex items-center gap-2 self-center font-bold text-2xl text-[#181C62] dark:text-sky-50">
                    <img src="/rep-logo.jpg" className="size-8 dark:hidden" />
                    NTU REP
                </div>
                <div className="flex items-center self-center text-lg">
                    Meeting Room Booking System
                </div>
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Help</CardTitle>
                        <div>Please contact <b>REClub</b> for any questions that are not answered here.</div>
                    </CardHeader>
                    <CardContent>
                        <Accordion defaultValue={[0]}>
                            {helpItems.map((helpItem, idx) => (
                                <AccordionItem value={idx}>
                                    <AccordionTrigger>
                                        {helpItem.title}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {helpItem.content}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>

                <Card className="bg-muted/50 border-dashed">
                    <CardContent className="text-sm text-muted-foreground">
                        <p>
                            I am looking for a new maintainer to take over this project.
                            If you are interested in contributing or taking ownership, please contact me directly.
                        </p>
                        <div className="mt-4 flex gap-3">
                            <a
                                href="https://t.me/kohmingyang"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-sky-500 hover:underline dark:text-sky-400"
                            >
                                Contact via Telegram
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div >
    )
}
