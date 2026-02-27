/**
 * LevelNav Component - Sidebar with level list
 * 
 * Displays navigation for all tutorial levels with:
 * - Collapsible sidebar for mobile
 * - Progress overview
 * - Level cards with status indicators
 * - Keyboard navigation support
 */

import { type ReactElement, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTutorialStore } from '@/stores';
import { RetroPanel } from '@/components/common';
import LevelCard from '../LevelCard';
import ProgressBar from '../ProgressBar';

export interface LevelNavProps {
    /** Whether the sidebar is collapsible (mobile) */
    collapsible?: boolean;
    /** Initial collapsed state */
    initialCollapsed?: boolean;
    /** Additional CSS classes */
    className?: string;
}

function LevelNav({
    collapsible = false,
    initialCollapsed = false,
    className = '',
}: LevelNavProps): ReactElement {
    const { t } = useTranslation();
    const { levels, currentLevelId, progress } = useTutorialStore();
    const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

    const toggleCollapse = useCallback(() => {
        setIsCollapsed((prev) => !prev);
    }, []);

    // Calculate overall progress
    const completedCount = Object.values(progress).filter(
        (p) => p.status === 'completed'
    ).length;
    const totalLevels = levels.length;
    const progressPercentage = totalLevels > 0 ? (completedCount / totalLevels) * 100 : 0;

    // Render level cards
    const renderLevelCards = () => (
        <nav aria-label="Tutorial levels">
            <ul className="space-y-2" role="list">
                {levels.map((level, index) => {
                    const levelProgress = progress[level.id];
                    const isCompleted = levelProgress?.status === 'completed';
                    const isActive = level.id === currentLevelId;

                    return (
                        <li key={level.id}>
                            <LevelCard
                                id={level.id}
                                number={index + 1}
                                titleKey={t(`levels:${level.titleKey}`, level.titleKey)}
                                isCompleted={isCompleted}
                                isActive={isActive}
                            />
                        </li>
                    );
                })}
            </ul>
        </nav>
    );

    // Collapsible variant for mobile
    if (collapsible) {
        return (
            <div className={`${className}`}>
                {/* Toggle button */}
                <button
                    type="button"
                    onClick={toggleCollapse}
                    className="w-full retro-btn retro-btn-primary mb-4"
                    aria-expanded={!isCollapsed}
                    aria-controls="level-nav-content"
                >
                    <span className="flex items-center justify-between w-full">
                        <span>{t('tutorial.levels', 'Levels')}</span>
                        <span
                            className="transition-transform"
                            style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}
                            aria-hidden="true"
                        >
                            ▼
                        </span>
                    </span>
                </button>

                {/* Collapsible content */}
                <div
                    id="level-nav-content"
                    className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-h-0' : 'max-h-[2000px]'
                        }`}
                    aria-hidden={isCollapsed}
                >
                    {/* Progress */}
                    <div className="mb-4">
                        <ProgressBar
                            value={progressPercentage}
                            label={t('tutorial.progress', 'Progress')}
                            animated
                        />
                    </div>

                    {/* Level list */}
                    {renderLevelCards()}
                </div>
            </div>
        );
    }

    // Default sidebar variant
    return (
        <RetroPanel
            variant="terminal"
            title="LEVELS.SYS"
            className={`p-4 ${className}`}
        >
            <div className="pt-6">
                {/* Progress */}
                <div className="mb-6">
                    <ProgressBar
                        value={progressPercentage}
                        label={t('tutorial.progress', 'Progress')}
                        animated
                    />
                    <div className="font-terminal text-sm text-[var(--color-text-muted)] mt-2">
                        {completedCount} / {totalLevels} {t('tutorial.completed', 'completed')}
                    </div>
                </div>

                {/* Level list */}
                {renderLevelCards()}
            </div>
        </RetroPanel>
    );
}

export default LevelNav;
