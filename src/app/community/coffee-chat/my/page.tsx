import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth-utils';
import { MyCoffeeChatClient } from './MyCoffeeChatClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '내 커피챗 | Namecard',
  description: '보내고 받은 커피챗 요청을 관리하세요',
};

export default async function MyCoffeeChatPage() {
  const user = await getServerUser();

  if (!user) {
    redirect('/community/coffee-chat');
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <MyCoffeeChatClient />
    </div>
  );
}
