"use client";

import Stories from "@/app/(PagesComps)/homedir/stories";
import Posts from "@/app/(PagesComps)/homedir/posts";
import ChatsBox from "@/app/(PagesComps)/messegedir/chatlist";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <ChatsBox />
        </div>
    )
};
