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

    BlockView = BlockView;

    blockView = signal<BlockView>(BlockView.PREVIEW);

    codeCopyLoading = signal(false);

    codeCopied = signal(false);

    /**
     * Runs activate view.
     *
     * @param event - event value.
     *
     * @param blockView - block view value.
     */
    activateView(event: Event, blockView: BlockView) {
        this.blockView.set(blockView);
        event.preventDefault();
    }

    /**
     * Runs copy code.
     *
     * @param event - event value.
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
