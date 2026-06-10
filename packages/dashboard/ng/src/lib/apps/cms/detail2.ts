import { NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

interface Section {
    id: string;
    title: string;
}

/** Alternative CMS article detail page. */
@Component({
    selector: 'app-detail2',
    imports: [NgClass, ButtonModule, TagModule],
    templateUrl: './detail2.html',
    styles: `
        h1,
        h2,
        h3,
        h4,
        h5,
        h6,
        p {
            overflow-wrap: break-word;
            word-wrap: break-word;
            word-break: break-word;
        }
    `
})
export class Detail2 implements OnInit, OnDestroy {
    /**
     * Article section id currently highlighted in the sticky table of contents.
     */
    activeSection = signal('manufacturing-giants');

    /**
     * Whether scroll spy updates are paused during smooth programmatic scrolling.
     */
    isScrollBlocked = false;
    private scrollHandler: (() => void) | null = null;

    /**
     * Article sections tracked by the table of contents and scroll spy.
     */
    sections: Section[] = [
        { id: 'manufacturing-giants', title: 'How Manufacturing Giants Drive Economic Growth' },
        { id: 'manufacturing-investment', title: 'Manufacturing Investment: Risk or Opportunity?' },
        { id: 'strategic-manufacturing', title: 'Strategic Manufacturing Investment' },
        { id: 'workforce-development', title: 'Workforce Development and Skills Training' }
    ];

    /**
     * Registers the scroll listener and initializes the active section.
     */
    ngOnInit() {
        this.scrollHandler = this.handleScroll.bind(this);
        this.handleScroll();
        window.addEventListener('scroll', this.scrollHandler, { passive: true });
    }

    /**
     * Removes the scroll listener registered by this page.
     */
    ngOnDestroy() {
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
        }
    }

    /**
     * Smoothly scrolls to an article section and temporarily blocks scroll spy updates.
     *
     * @param sectionId - Section id to scroll into view.
     */
    scrollToSection(sectionId: string) {
        this.activeSection.set(sectionId);
        this.isScrollBlocked = true;

        const element = document.getElementById(sectionId);
        if (element) {
            const yOffset = -80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY + yOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            setTimeout(() => {
                this.isScrollBlocked = false;
                setTimeout(() => {
                    this.handleScroll();
                }, 50);
            }, 800);
        } else {
            this.isScrollBlocked = false;
        }
    }

    /**
     * Calculates the table-of-contents indicator offset for the active section.
     *
     * @returns Pixel offset for the active section indicator.
     */
    getIndicatorOffset(): number {
        const index = this.sections.findIndex((s) => s.id === this.activeSection());
        const baseOffset = index * 44;
        const isFirst = index === 0;
        const isLast = index === this.sections.length - 1;
        const adjustment = isFirst ? 13 : isLast ? -4 : 0;
        return baseOffset + adjustment;
    }

    private getElementTop(element: HTMLElement): number {
        const rect = element.getBoundingClientRect();
        return rect.top + window.scrollY;
    }

    private getScrollTop(): number {
        return window.scrollY;
    }

    private handleScroll() {
        if (this.isScrollBlocked) {
            return;
        }

        const scrollTop = this.getScrollTop();
        const threshold = 100;
        const oldActiveSection = this.activeSection();

        const sectionElements = this.sections
            .map((section) => ({
                ...section,
                element: document.getElementById(section.id)
            }))
            .filter((section): section is typeof section & { element: HTMLElement } => section.element !== null)
            .map((section) => ({
                ...section,
                top: this.getElementTop(section.element)
            }))
            .sort((a, b) => a.top - b.top);

        if (sectionElements.length === 0) {
            return;
        }

        let newActiveSection = sectionElements[0].id;

        for (let i = 0; i < sectionElements.length; i++) {
            const section = sectionElements[i];
            const hasPassedSection = scrollTop >= section.top - threshold;

            if (hasPassedSection) {
                newActiveSection = section.id;
            } else {
                break;
            }
        }

        if (oldActiveSection !== newActiveSection) {
            this.activeSection.set(newActiveSection);
        }
    }
}
