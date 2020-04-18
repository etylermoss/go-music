/* 3rd party imports */
import path from 'path';
import fs from 'fs'; 
import he from 'he';
import fxp from 'fast-xml-parser';

interface XMLMap {
	path: string;
	children: string[];
}

/** Represents a file that was changed (deleted or added) and its path */
interface Diff {
	/** Name of the file, e.g 'nggyu.mp3' */
	name: string;
	/** Directory path to the file from the root dir (XML root, not FS root), e.g /MyMusic/RickAstley */
	path: string;
	/** How it was changed, either 'deleted' or 'added' */
	change: string;
}

/** Takes a path and returns an XML representation of its tree */
const treeToXML = async (rootPath: string, extensionWhitelist: string[]): Promise<string> => {
	rootPath = path.normalize(rootPath);
	let result = `<dir name="${he.encode(path.basename(rootPath))}">`;
	const files = await fs.promises.readdir(rootPath);
	/* If the directory is empty or hidden, return empty string */
	if (files.length === 0 || path.basename(rootPath)[0] === '.') {
		return '';
	}
	for (let file of files) {
		file = path.join(rootPath, file);
		result += await fs.promises.stat(file)
			.then(stat => {
				if (stat && stat.isDirectory()) {
					/* Resurse into subdir */
					return treeToXML(file, extensionWhitelist);
				} else if (extensionWhitelist.includes(path.extname(file).toLowerCase())) {
					/* Is a file, and its extension is whitelisted */
					return `<file name="${he.encode(path.basename(file))}"/>`;
				}
			});
	}
	return result + '</dir>';
};

const getXMLDiff = (lhs: string, rhs: string): Diff[] => {
	if (lhs === rhs) return null;

	/** Converts arrayMode fast-xml-parser XML object into map of the values (dir and file tags) */
	const buildMap = (element: any, path: string, map: XMLMap[] = []): XMLMap[] => {
		/* The current map directory we're working on */
		const index = map.push({path: path, children: []});

		/* Loop through each property of the directory tag obj, should only contain name, dir, and file tags */
		for (const key of Object.keys(element)) {
			if (key === 'dir') {
				/* Recurse into child directory, messy due to the nature of fxp arrayMode objects */
				for (const dir of element[key]) {
					if (dir) buildMap(dir, `${path}/${dir.name}`, map);
				}
			} else if (key === 'file') {
				/* Loop through all the files in the files obj (gets all file tags) */
				for (const file of element[key]) {
					if (file) map[index - 1].children.push(file.name);
				}
			}
		}
		return map;
	};

	/** Compares two XML maps produced by buildMap, returning array of the differences. */
	const diffMaps = (oldMap: XMLMap[], newMap: XMLMap[], secondPass?: boolean): Diff[] => {
		let changes: Diff[] = [];
		for (let index = 0; index<oldMap.length; index++) {
			const newMapIndex = newMap.findIndex(element => {
				return element.path === oldMap[index].path ? true : false;
			});
			if (newMapIndex >= 0) {
				//compare children;
				for (const child of oldMap[index].children) {
					if (!newMap[newMapIndex].children.includes(child)) {
						changes.push({
							name: child,
							path: oldMap[index].path,
							change: secondPass ? 'deleted' : 'added',
						});
					}
				}
			} else {
				/* If the element (dir) cannot be found in the newMap, all its children must not exist */
				for (const child of oldMap[index].children) {
					changes.push({
						name: child,
						path: oldMap[index].path,
						change: secondPass ? 'deleted' : 'added',
					});
				}
			}
		}
		/* Recurse function reversed, getting elements that have been added not deleted */
		if (secondPass) changes = changes.concat(diffMaps(newMap, oldMap, true));
		return changes;
	};

	const fxpOptions = {
		ignoreAttributes : false,
		attributeNamePrefix: '',
		arrayMode: true,
		attrValueProcessor: (val: string): string => he.decode(val, {isAttributeValue: true}),
		tagValueProcessor: (val: string): string => he.decode(val),
		trimValues: true,
	};

	const lhsParsed = fxp.parse(lhs, fxpOptions);
	const rhsParsed = fxp.parse(rhs, fxpOptions);

	const lhsMap = buildMap(lhsParsed.dir[0], `/${lhsParsed.dir[0].name}`);
	const rhsMap = buildMap(rhsParsed.dir[0], `/${rhsParsed.dir[0].name}`);

	return diffMaps(lhsMap, rhsMap);

};

export { treeToXML, getXMLDiff, Diff };