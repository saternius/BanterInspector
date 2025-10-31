/**
 * TemplateLoader - Manages loading and caching of HTML templates
 * Part of Phase 1 Firebase Migration Plan
 */
export class TemplateLoader {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl || window.repoUrl || '';
        this.cache = new Map();
        this.templateNames = [
            'navigation',
            'world-inspector',
            'space-props',
            'inventory',
            'feedback'
        ];
    }

    /**
     * Load a single template by name
     * @param {string} templateName - Name of the template file (without .html extension)
     * @returns {Promise<string>} - The template HTML content
     */
    async load(templateName) {
        // Return from cache if already loaded
        if (this.cache.has(templateName)) {
            return this.cache.get(templateName);
        }

        const url = `${this.baseUrl}/templates/${templateName}.html`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to load template: ${templateName} (${response.status})`);
        }

        const template = await response.text();
        this.cache.set(templateName, template);
        return template;
    }

    /**
     * Load all templates at once
     * @returns {Promise<Object>} - Object with template name as key and content as value
     */
    async loadAll() {
        const templates = {};
        const promises = this.templateNames.map(name =>
            this.load(name).then(content => {
                templates[name] = content;
            })
        );

        await Promise.all(promises);
        return templates;
    }

    /**
     * Load multiple specific templates
     * @param {Array<string>} templateNames - Array of template names to load
     * @returns {Promise<Object>} - Object with template name as key and content as value
     */
    async loadMultiple(templateNames) {
        const templates = {};
        const promises = templateNames.map(name =>
            this.load(name).then(content => {
                templates[name] = content;
            })
        );

        await Promise.all(promises);
        return templates;
    }

    /**
     * Clear the template cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Clear a specific template from cache
     * @param {string} templateName - Name of the template to remove from cache
     */
    clearTemplate(templateName) {
        this.cache.delete(templateName);
    }

    /**
     * Check if a template is cached
     * @param {string} templateName - Name of the template to check
     * @returns {boolean} - True if template is in cache
     */
    isCached(templateName) {
        return this.cache.has(templateName);
    }

    /**
     * Get all cached template names
     * @returns {Array<string>} - Array of cached template names
     */
    getCachedTemplates() {
        return Array.from(this.cache.keys());
    }

    /**
     * Preload templates for better performance
     * This can be called early in the application lifecycle
     */
    async preload() {
        console.log('Preloading templates...');
        const startTime = performance.now();

        await this.loadAll();

        const endTime = performance.now();
        console.log(`Templates preloaded in ${(endTime - startTime).toFixed(2)}ms`);
    }
}

// Export default instance for convenience
export const templateLoader = new TemplateLoader();