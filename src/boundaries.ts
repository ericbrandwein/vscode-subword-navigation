import { Position, TextDocument } from 'vscode';

export function nextBoundaryLeft(document: TextDocument, position: Position) {
    const line = document.lineAt(position);
    const range = document.getWordRangeAtPosition(position);

    // not actually within a word
    // find end of previous one or mimic cursorWordLeft's line/whitespace handling
    if (!range || range.start.isEqual(position)) {
        if (position.character === 0) {
            if (position.line === 0) return position;
            const prevLine = document.lineAt(position.line - 1);
            for (let i = prevLine.range.end; i.isAfter(prevLine.range.start); i = i.translate(0, -1)) {
                if (!/\s/.test(prevLine.text[i.character - 1])) return i;
            }
            return prevLine.range.start;
        }
        let off = 0;
        for (let i = position.translate(0, -1); i.isAfter(line.range.start); i = i.translate(0, -1)) {
            if (!/\s/.test(line.text[i.character])) return i.translate(0, off);
            off = 1;
        }
        return line.range.start;
    }

    // find previous word boundary
    for (let i = position.translate(0, -1); i.isAfter(range.start); i = i.translate(0, -1)) {
        if (isBoundary(line.text, i)) return i;
    }

    // found no boundary before word start
    return range.start;
}

export function nextBoundaryRight(document: TextDocument, position: Position) {
    const line = document.lineAt(position);
    const range = document.getWordRangeAtPosition(position);

    // not actually within a word
    // find beginning of next one or mimic cursorWordRight's line/whitespace handling
    if (!range || range.end.isEqual(position)) {
        if (position.character === line.range.end.character) {
            if (position.line + 1 >= document.lineCount) return position;
            const nextLine = document.lineAt(position.line + 1);
            return nextLine.range.start.translate(0, nextLine.firstNonWhitespaceCharacterIndex);
        }
        let off = 1;
        for (let i = position.translate(0, 0); i.isBeforeOrEqual(line.range.end); i = i.translate(0, 1)) {
            if (!/\s/.test(line.text[i.character])) return i.translate(0, off);
            off = 0;
        }
        return line.range.end;
    }

    // find next word boundary
    for (let i = position.translate(0, 1); i.isBeforeOrEqual(range.end); i = i.translate(0, 1)) {
        if (isBoundary(line.text, i)) return i;
    }

    // found no boundary before word end
    return range.end;
}

function isBoundary(text: string, position: Position) {
    const prev = char(text[position.character - 1]);
    const cur = char(text[position.character]);
    const next = char(text[position.character + 1]);
    
    if (cur.underscore && !prev.underscore) return true;
    else if (prev.underscore && !cur.underscore) return true;
    else if (cur.numeric && !prev.numeric) return true;
    else if (prev.numeric && !cur.numeric) return true;
    else if (cur.upper && prev.lower) return true;
    else if (cur.upper && next.lower) return true;
    
    return false;
}

function char(c: string) {
    const cl = { none: false, upper: false, lower: false, numeric: false, underscore: false };
    
    if (!c) cl.none = true;
    else if (c === '_') cl.underscore = true;
    else if (isNumber(c)) cl.numeric = true;
    else if (isUpper(c)) cl.upper = true;
    else if (isLower(c)) cl.lower = true;
    
    return cl;
}

function isUpper(c: string) {
	return c === c.toUpperCase() && c !== c.toLowerCase();
}

function isLower(c: string) {
	return c === c.toLowerCase() && c !== c.toUpperCase();
}

function isNumber(c: string) {
    return !!(<any>c / 0);
}
