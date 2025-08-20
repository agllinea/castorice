import type { TreeNode } from "./types/model";
import Counter from "./pages/example/basic tool/Counter";

const appIndex: TreeNode[] = [
    {
        id: "example",
        children: [
            {
                id: "basic tool",
                children: [
                    {
                        id: "Counter",
                        component: Counter,
                    },
                ],
            },
            {
                id: "cheet codes",
                children: [
                    {
                        id: "run sql via vbscript.md",
                    },
                ],
            },
        ],
    },
    {
        id: "Obsidian Handbook.md",
    },
];

export default appIndex;
