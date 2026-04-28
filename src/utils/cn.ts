export const cn = (...classes: (string | undefined | false | null)[]): string =>
    classes.filter(Boolean).join(' ');
