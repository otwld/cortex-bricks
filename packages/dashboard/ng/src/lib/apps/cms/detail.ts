import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { Card } from 'primeng/card';

interface Comment {
    image: string;
    name: string;
    title: string;
}

/** CMS article detail page. */
@Component({
    selector: 'app-detail',
    imports: [ButtonModule, DividerModule, TagModule, Card],
    templateUrl: './detail.html',
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
export class Detail {
    /**
     * Author comments shown below the article content.
     */
    comments: Comment[] = [
        {
            image: '/demo/images/cms/avatars/avatar-emma.jpg',
            name: 'Emma Stone',
            title: 'Founder'
        },
        {
            image: '/demo/images/cms/avatars/avatar-darrell.jpg',
            name: 'Darrell Steward',
            title: 'CEO'
        },
        {
            image: '/demo/images/cms/avatars/avatar-jane.jpg',
            name: 'Jane Cooper',
            title: 'Founder'
        }
    ];
}
