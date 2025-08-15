import { readdirSync, writeFileSync } from "fs";
import { join, relative, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

const DOCS_DIR = resolve(__dirname, "../public/docs");
const PAGES_DIR = resolve(__dirname, "../src/pages");
const OUTPUT_FILE = resolve(__dirname, "../src/appIndex.ts");

// Helper to get folder structure recursively
function getFolderStructure(dir, isPages = false, baseImport = ".") {
    const result = [];
    const items = readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        if (item.isDirectory()) {
            const children = getFolderStructure(join(dir, item.name), isPages, baseImport);
            result.push({ id: item.name, children });
        } else {
            // Only .md files for docs, .tsx files for pages
            if (!isPages && item.name.endsWith(".md")) {
                result.push({ id: item.name });
            }
            if (isPages && item.name.endsWith(".tsx")) {
                const importPath = relative(join(__dirname, "../src"), join(dir, item.name)).replace(/\\/g, "/").replace(/\.tsx$/, "");
                const id = item.name.replace(/\.tsx$/, "");
                result.push({ id, importPath: `${baseImport}/${importPath}` });
            }
        }
    }
    return result;
}

// Flatten pages structure for imports
function collectImports(structure, imports = []) {
    for (const item of structure) {
        if (item.children) {
            collectImports(item.children, imports);
        } else if (item.importPath) {
            imports.push({ id: item.id, importPath: item.importPath });
        }
    }
    return imports;
}

function buildAppIndex(docs, pages) {
    function mapDocs(docs) {
        return docs.map(item =>
            item.children
                ? { id: item.id, children: mapDocs(item.children) }
                : { id: item.id }
        );
    }

    function mapPages(pages) {
        return pages.map(item =>
            item.children
                ? { id: item.id, children: mapPages(item.children) }
                : { id: item.id, component: item.id }
        );
    }

    function mergeArrays(arr1, arr2) {
        const mergedMap = new Map();

        // Helper to merge two nodes by id
        function mergeNodes(a, b) {
            const result = { ...a, ...b };
            if (a.children || b.children) {
                result.children = mergeArrays(a.children || [], b.children || []);
            }
            return result;
        }

        // Put all arr1 into map
        for (const item of arr1) {
            mergedMap.set(item.id, { ...item });
        }

        // Merge arr2 into map
        for (const item of arr2) {
            if (mergedMap.has(item.id)) {
                mergedMap.set(item.id, mergeNodes(mergedMap.get(item.id), item));
            } else {
                mergedMap.set(item.id, { ...item });
            }
        }

        return Array.from(mergedMap.values());
    }

    return mergeArrays(mapPages(pages), mapDocs(docs));
}


// Main
const docsStructure = getFolderStructure(DOCS_DIR, false);
const pagesStructure = getFolderStructure(PAGES_DIR, true);

const imports = collectImports(pagesStructure);
const appIndex = buildAppIndex(docsStructure, pagesStructure);

// Generate import statements
const importStatements = imports
    .map(i => `import ${i.id} from "${i.importPath}";`)
    .join("\n");

// Generate appIndex code
const appIndexCode =
    `import type { TreeNode } from "./type";\n${importStatements}\n\n` +
    `const appIndex : TreeNode[] = ${JSON.stringify(appIndex, null, 4).replace(/"component":\s*"(\w+)"/g, 'component: $1')};\n\n` +
    `export default appIndex;\n`;

// Write to file
writeFileSync(OUTPUT_FILE, appIndexCode, "utf8");
console.log("src/appIndex.ts generated.");