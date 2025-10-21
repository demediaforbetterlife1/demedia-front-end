"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { getEnhancedThemeClasses } from "@/utils/enhancedThemeUtils";
import Stories from "@/app/(PagesComps)/homedir/stories";
import Posts from "@/app/(PagesComps)/homedir/posts";

export default function HomePage() {
    const { theme } = useTheme();
    const themeClasses = getEnhancedThemeClasses(theme);

    return (
        <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} flex flex-col pb-20 md:pb-0`}>
            <Stories />
            <Posts postId={resolvedParams.id} isVisible={true} />
        </div>
    )
};
