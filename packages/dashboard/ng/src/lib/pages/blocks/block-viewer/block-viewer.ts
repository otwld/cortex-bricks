import { booleanAttribute, Component, Input, signal } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';

enum BlockView {
    PREVIEW,
    CODE
}

/** Renders a named UI block with a live preview, code viewer, and copy button. */
@Component({
    selector: 'app-block-viewer',
    imports: [NgClass, NgStyle],
    templateUrl: './block-viewer.html',
})
export class BlockViewer {
    /** Title displayed in the block header. */
    @Input() header!: string;

    /** Raw HTML/Angular code shown in the code tab. */
    @Input() code!: string;

    /** CSS class applied to the preview container. */
    @Input() containerClass!: string;

    /** Inline style object applied to the preview container. */
    @Input() previewStyle!: object;

    /** Whether this block is freely available. */
    @Input({ transform: booleanAttribute }) free = true;

    /** Whether this block should show a new badge. */
    @Input({ transform: booleanAttribute }) new = false;

    /**
     * Block view enum exposed for template comparisons.
     */
    BlockView = BlockView;

    /**
     * Currently active block viewer tab.
     */
    blockView = signal<BlockView>(BlockView.PREVIEW);

    /**
     * Whether code is currently being copied to the clipboard.
     */
    codeCopyLoading = signal(false);

    /**
     * Whether the copy confirmation state should be shown.
     */
    codeCopied = signal(false);

    /**
     * Switches between preview and code views.
     *
     * @param event - Click event from the tab control.
     * @param blockView - Block view to activate.
     */
    activateView(event: Event, blockView: BlockView) {
        this.blockView.set(blockView);
        event.preventDefault();
    }

    /**
     * Copies the block code to the clipboard and shows a transient confirmation.
     *
     * @param event - Click event from the copy action.
     */
    async copyCode(event: Event) {
        this.codeCopyLoading.set(true);
        event.preventDefault();

        await navigator.clipboard.writeText(this.code);

        this.codeCopyLoading.set(false);
        this.codeCopied.set(true);

        setTimeout(() => {
            this.codeCopied.set(false);
        }, 2000);
    }
}
