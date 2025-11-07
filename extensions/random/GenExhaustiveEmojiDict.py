#!/usr/bin/env python3
"""
Generate an exhaustive list of emojis from Unicode's official emoji-test.txt
Categorized systematically for the inventory emoji picker.
Usage: python3 GenExhaustiveEmojiDict.py > emoji_categories.json
"""

import json
import re
import urllib.request
import urllib.error

# -------------- Config --------------
EMOJI_TEST_URLS = [
    # Try "latest" first; if that ever 404s, fallback to a pinned version.
    'https://unicode.org/Public/emoji/latest/emoji-test.txt',
    'https://unicode.org/Public/emoji/15.1/emoji-test.txt',
]

KEEP_FLAGS = True        # set False if you don't want flags in your picker
KEEP_COMPONENTS = False   # skin tones/hair components as standalone emoji

# Your top-level categories (will be created automatically)
TARGET_CATS = [
    'Objects', 'Tech', 'Tools', 'Media', 'Games', 'Nature', 'Symbols', 'Shapes',
    'People', 'Animals', 'Food', 'Transport', 'Places', 'Activities', 'Flags'
]

# Mapping from Unicode group/subgroup → your categories.
# This is opinionated but practical; tweak to taste.
GROUP_MAPPING = {
    'Smileys & Emotion': {
        r'face-.*|emotion|cat-face|monkey-face': 'People',
        r'heart': 'Symbols'
    },
    'People & Body': {
        r'hand.*|person.*|family|body|role|fantasy': 'People'
    },
    'Component': {
        r'skin-tone|hair-style': None if not KEEP_COMPONENTS else 'Symbols'
    },
    'Animals & Nature': {
        r'animal-mammal|animal-bird|animal-amphibian|animal-reptile|animal-marine|animal-bug': 'Animals',
        r'plant-flower|plant-other': 'Nature',
        r'sky & weather': 'Nature'
    },
    'Food & Drink': {
        r'food-fruit|food-vegetable|food-prepared|food-asian|food-marine|food-sweet|drink|dishware': 'Food'
    },
    'Travel & Places': {
        r'place-map|place-geographic': 'Places',
        r'place-building|place-religious|place-other': 'Places',
        r'transport-ground|transport-water|transport-air': 'Transport',
        r'hotel|time': 'Objects',
        r'sky & weather': 'Nature'
    },
    'Activities': {
        r'event|award-medal|sport|game': 'Activities',
        r'arts & crafts': 'Media'
    },
    'Objects': {
        r'clothing|sound|music|musical-instrument': 'Media',
        r'phone|computer': 'Tech',
        r'light & video|camera': 'Tech',
        r'book-paper|book|writing|office': 'Objects',
        r'mail|e-mail': 'Tech',
        r'lock|key': 'Tech',
        r'tool': 'Tools',
        r'science|medical': 'Tools',
        r'household': 'Objects',
        r'other-object|money': 'Objects'
    },
    'Symbols': {
        r'transport-sign|warning': 'Symbols',
        r'arrow': 'Symbols',
        r'religion|zodiac': 'Symbols',
        r'av-symbol': 'Media',
        r'gender|math': 'Symbols',
        r'punctuation|currency': 'Symbols',
        r'other-symbol|keycap': 'Symbols',
        r'alphanum': 'Symbols',
        r'geometric': 'Shapes',
        r'flag': 'Symbols'
    },
    'Flags': {
        r'flag|country-flag|subdivision-flag': 'Flags' if KEEP_FLAGS else None
    }
}

def fetch_emoji_test():
    """Fetch emoji-test.txt with fallbacks"""
    last_error = None
    for url in EMOJI_TEST_URLS:
        try:
            print(f"Fetching {url}...", end=' ')
            with urllib.request.urlopen(url) as response:
                text = response.read().decode('utf-8')
                print("Success!")
                return text
        except (urllib.error.URLError, urllib.error.HTTPError) as e:
            print(f"Failed: {e}")
            last_error = e
    
    raise Exception(f"Failed to fetch emoji-test.txt: {last_error}")

def map_to_category(group, subgroup):
    """Map Unicode group/subgroup to our category"""
    if group not in GROUP_MAPPING:
        return 'Symbols'  # Default fallback
    
    group_map = GROUP_MAPPING[group]
    for pattern, category in group_map.items():
        if category is None:
            return None  # Skip this emoji
        if re.search(pattern, subgroup, re.IGNORECASE):
            return category
    
    # Default categories for unmapped subgroups
    if 'People' in group:
        return 'People'
    elif 'Animal' in group:
        return 'Animals'
    elif 'Food' in group:
        return 'Food'
    elif 'Symbol' in group:
        return 'Symbols'
    else:
        return 'Objects'

def parse_emoji_test(text):
    """Parse emoji-test.txt and categorize emojis"""
    lines = text.split('\n')
    
    current_group = ''
    current_subgroup = ''
    
    # Result buckets
    buckets = {cat: set() for cat in TARGET_CATS}
    buckets['Misc'] = set()  # For uncategorized
    
    for line in lines:
        line = line.strip()
        
        # Track current group/subgroup
        if line.startswith('# group:'):
            current_group = line[8:].strip()
            continue
        if line.startswith('# subgroup:'):
            current_subgroup = line[11:].strip()
            continue
        
        # Skip comments and empty lines
        if not line or line.startswith('#'):
            continue
        
        # Parse emoji lines
        # Format: 1F600 ; fully-qualified # 😀 E1.0 grinning face
        if ';' not in line or '#' not in line:
            continue
        
        parts = line.split(';')
        if len(parts) < 2:
            continue
        
        status = parts[1].split('#')[0].strip()
        
        # Only include fully-qualified emojis
        if 'fully-qualified' not in status:
            continue
        
        # Extract the emoji after the #
        hash_part = line.split('#')[1].strip()
        emoji_match = hash_part.split()[0] if hash_part else None
        
        if not emoji_match:
            continue
        
        # Skip components if configured
        if not KEEP_COMPONENTS and current_group == 'Component':
            continue
        
        # Skip flags if configured
        if not KEEP_FLAGS and current_group == 'Flags':
            continue
        
        # Map to category
        category = map_to_category(current_group, current_subgroup)
        
        if category:
            if category in buckets:
                buckets[category].add(emoji_match)
            else:
                buckets['Misc'].add(emoji_match)
    
    return buckets

def create_emoji_categories(buckets):
    """Convert sets to sorted arrays and ensure all categories exist"""
    emoji_categories = {}
    
    # Convert sets to sorted lists
    for category, emoji_set in buckets.items():
        if emoji_set:  # Only include non-empty categories
            # Sort by Unicode code point for consistency
            emoji_list = sorted(list(emoji_set))
            # Remove duplicates while preserving order
            seen = set()
            unique_list = []
            for emoji in emoji_list:
                if emoji not in seen:
                    seen.add(emoji)
                    unique_list.append(emoji)
            emoji_categories[category] = unique_list
    
    # Ensure target categories exist even if empty
    for cat in TARGET_CATS:
        if cat not in emoji_categories:
            emoji_categories[cat] = []
    
    # Remove Misc if empty
    if 'Misc' in emoji_categories and not emoji_categories['Misc']:
        del emoji_categories['Misc']
    
    return emoji_categories

def save_json(emoji_categories, filename='emoji_categories.json'):
    """Save to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(emoji_categories, f, ensure_ascii=False, indent=2)
    print(f"\nSaved to {filename}")
    
    # Print summary
    total = sum(len(emojis) for emojis in emoji_categories.values())
    print(f"Total categories: {len(emoji_categories)}")
    print(f"Total emojis: {total}")
    print("\nCategory breakdown:")
    for cat, emojis in emoji_categories.items():
        print(f"  {cat}: {len(emojis)} emojis")

def save_javascript(emoji_categories, filename='emoji_categories.js'):
    """Save as JavaScript const for easy integration"""
    js_lines = ['const emojiCategories = {']
    
    for i, (category, emojis) in enumerate(emoji_categories.items()):
        # Format emojis as JavaScript array
        emoji_str = ', '.join(f'"{emoji}"' for emoji in emojis)
        comma = ',' if i < len(emoji_categories) - 1 else ''
        js_lines.append(f'  "{category}": [{emoji_str}]{comma}')
    
    js_lines.append('};')
    js_lines.append('\nexport default emojiCategories;')
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write('\n'.join(js_lines))
    
    print(f"Saved JavaScript to {filename}")

def main():
    """Main function"""
    try:
        # Fetch the Unicode emoji data
        text = fetch_emoji_test()
        
        # Parse and categorize
        print("Parsing emojis...")
        buckets = parse_emoji_test(text)
        
        # Create final categories
        emoji_categories = create_emoji_categories(buckets)
        
        # Save outputs
        save_json(emoji_categories)
        save_javascript(emoji_categories)
        
        # Also print to stdout for piping
        print("\n" + "="*50)
        print("JSON output:")
        print("="*50)
        print(json.dumps(emoji_categories, ensure_ascii=False, indent=2))
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()