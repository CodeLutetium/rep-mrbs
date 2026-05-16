import TelegramQRCode from "@/components/telegram-qr-code";
import { useUser } from "@/context/user-context";
import { getTelegramCode, type GetTelegramCodeResponse } from "@/services/telegram-service";
import { useEffect, useState } from "react"
import { toast } from "sonner";

export const bot_telegram_url = import.meta.env.PROD ? "https://t.me/rep_mrbs_bot" : "https://t.me/rep_mrbs_dev_bot"

export default function LinkTelegramPage() {
  // Start code ties telegram account with mrbs account 
  const [code, setCode] = useState<string | null>(null);
  const user = useUser();

  if (!user) {
    return null;
  }

  useEffect(() => {
    async function fetchTelegramCode() {
      const res: GetTelegramCodeResponse = await getTelegramCode();
      if (res.error) {
        console.error(res.error);
        toast.error("Error generating Telegram code. Please try again later.");
      } else {
        setCode(res.code!);
      }
    }

    fetchTelegramCode();
  }, [user])

  return (
    <div className="flex h-full flex-col items-center gap-6 p-6 md:p-10">
      <div className="mx-auto grid w-full max-w-6xl gap-2 py-8">
        <h1 className="text-3xl font-semibold text-center text-primary">Link to Telegram</h1>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto">
          Link your account to start booking rooms directly from Telegram.
          Scan the code below to authorize <a className="text-[#229ED9] hover:underline" target="_blank" href={bot_telegram_url}>ReppyBooky</a> and manage your bookings on the go.
        </p>
      </div>


      <TelegramQRCode code={code!} />
    </div >
  )
}
