"use client";

import Stories from "@/app/(PagesComps)/homedir/stories";
import Posts from "@/app/(PagesComps)/homedir/posts";

export default function HomePage() {
    return (
        <div className="min-h-screen theme-bg-primary theme-text-primary flex flex-col pb-20 md:pb-0">
            <Stories />
            <Posts />
        </div>
    )
};
