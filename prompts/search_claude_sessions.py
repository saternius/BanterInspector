#!/usr/bin/env python3
"""
Search tool for finding past Claude conversations and resuming sessions.
Searches through ~/.claude/projects/ for conversation history.
"""

import os
import sys
import json
import argparse
import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import subprocess

# Color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    DIM = '\033[2m'

class ClaudeSessionSearcher:
    def __init__(self, claude_dir="/home/jason/.claude/projects"):
        self.claude_dir = Path(claude_dir)
        self.sessions = []

    def load_session_data(self, session_file):
        """Load and parse a Claude session file."""
        try:
            # Check if it's a JSONL file
            if str(session_file).endswith('.jsonl'):
                messages = []
                with open(session_file, 'r', encoding='utf-8', errors='ignore') as f:
                    for line in f:
                        if line.strip():
                            try:
                                entry = json.loads(line)
                                # Look for user and assistant messages
                                if entry.get('type') in ['user', 'assistant'] and 'message' in entry:
                                    messages.append(entry['message'])
                            except json.JSONDecodeError:
                                continue
                if messages:
                    return {'messages': messages}
                return None
            else:
                # Try as regular JSON file
                with open(session_file, 'r', encoding='utf-8', errors='ignore') as f:
                    data = json.load(f)
                    return data
        except json.JSONDecodeError:
            # Try reading as plain text if not JSON
            try:
                with open(session_file, 'r', encoding='utf-8', errors='ignore') as f:
                    return {'content': f.read(), 'type': 'text'}
            except:
                return None
        except Exception as e:
            return None

    def extract_conversation_messages(self, data):
        """Extract conversation messages from session data, separating user and assistant messages."""
        if not data:
            return [], []

        user_messages = []
        assistant_messages = []
        all_messages = []

        # Handle different data structures
        if isinstance(data, dict):
            if 'messages' in data:
                # Chat format with messages
                for msg in data.get('messages', []):
                    if isinstance(msg, dict):
                        role = msg.get('role', 'unknown').lower()
                        content = msg.get('content', '')

                        # Extract text content
                        text_content = ""
                        if isinstance(content, list):
                            # Handle content as list of parts
                            for part in content:
                                if isinstance(part, dict):
                                    if 'text' in part:
                                        text_content += part['text']
                                    elif 'content' in part:
                                        part_content = part['content']
                                        if isinstance(part_content, str):
                                            text_content += part_content
                                elif isinstance(part, str):
                                    text_content += part
                        elif isinstance(content, str):
                            text_content = content

                        # Clean up the text
                        text_content = text_content.strip()

                        if text_content:
                            message = {'role': role, 'content': text_content}
                            all_messages.append(message)

                            if role in ['user', 'human']:
                                user_messages.append(text_content)
                            elif role in ['assistant', 'claude']:
                                assistant_messages.append(text_content)

            elif 'human' in data and 'assistant' in data:
                # Alternative format
                if data['human']:
                    user_messages.append(data['human'])
                    all_messages.append({'role': 'user', 'content': data['human']})
                if data['assistant']:
                    assistant_messages.append(data['assistant'])
                    all_messages.append({'role': 'assistant', 'content': data['assistant']})

        elif isinstance(data, list):
            # List of messages
            for item in data:
                if isinstance(item, dict):
                    user_msgs, asst_msgs, all_msgs = self.extract_conversation_messages(item)
                    user_messages.extend(user_msgs)
                    assistant_messages.extend(asst_msgs)
                    all_messages.extend(all_msgs)

        return user_messages, assistant_messages, all_messages

    def get_conversation_context(self, all_messages, user_message_index, num_before=2, num_after=2):
        """Get conversation context around a specific user message."""
        start_idx = max(0, user_message_index - num_before)
        end_idx = min(len(all_messages), user_message_index + num_after + 1)

        return all_messages[start_idx:end_idx]

    def find_keyword_in_messages(self, user_messages, all_messages, keyword):
        """Find keyword in user messages and get conversation context."""
        lower_keyword = keyword.lower()
        matches = []

        # Track which user message corresponds to which index in all_messages
        user_msg_indices = []
        for i, msg in enumerate(all_messages):
            if msg['role'] in ['user', 'human']:
                user_msg_indices.append(i)

        for user_idx, user_msg in enumerate(user_messages):
            if lower_keyword in user_msg.lower():
                # Find the corresponding index in all_messages
                if user_idx < len(user_msg_indices):
                    all_msg_idx = user_msg_indices[user_idx]

                    # Get conversation context
                    context_messages = self.get_conversation_context(
                        all_messages, all_msg_idx, num_before=2, num_after=2
                    )

                    # Find the exact position of the keyword in the user message
                    lower_msg = user_msg.lower()
                    keyword_positions = []
                    start = 0
                    while True:
                        pos = lower_msg.find(lower_keyword, start)
                        if pos == -1:
                            break
                        keyword_positions.append((pos, pos + len(keyword)))
                        start = pos + 1

                    matches.append({
                        'user_message': user_msg,
                        'context_messages': context_messages,
                        'keyword_positions': keyword_positions,
                        'all_msg_index': all_msg_idx
                    })

        return matches

    def search_sessions(self, keywords, max_results=None):
        """Search through all Claude sessions for keywords in user messages only."""
        results = []

        # Walk through Claude projects directory
        for root, dirs, files in os.walk(self.claude_dir):
            # Skip hidden directories except .claude itself
            dirs[:] = [d for d in dirs if not d.startswith('.') or d == '.claude']

            for file in files:
                # Look for conversation files (JSON, markdown, text)
                if not any(file.endswith(ext) for ext in ['.json', '.md', '.txt', '.jsonl']):
                    continue

                file_path = Path(root) / file
                relative_path = file_path.relative_to(self.claude_dir)

                # Load session data
                data = self.load_session_data(file_path)
                if not data:
                    continue

                # Extract conversation messages
                user_messages, assistant_messages, all_messages = self.extract_conversation_messages(data)
                if not user_messages:
                    continue

                # Search for keywords in user messages only
                matches = defaultdict(list)
                for keyword in keywords:
                    keyword_matches = self.find_keyword_in_messages(user_messages, all_messages, keyword)
                    if keyword_matches:
                        matches[keyword] = keyword_matches

                if matches:
                    # Get session metadata
                    project_name = relative_path.parts[0] if relative_path.parts else "unknown"
                    session_id = file_path.stem

                    # Try to get timestamp
                    try:
                        mtime = os.path.getmtime(file_path)
                        timestamp = datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
                    except:
                        timestamp = "unknown"

                    # Calculate relevance score
                    score = sum(len(keyword_matches) for keyword_matches in matches.values())

                    # Get first few messages for summary
                    summary_messages = all_messages[:5] if all_messages else []

                    results.append({
                        'file_path': str(file_path),
                        'relative_path': str(relative_path),
                        'project': project_name,
                        'session_id': session_id,
                        'timestamp': timestamp,
                        'matches': matches,
                        'score': score,
                        'all_messages': all_messages,
                        'summary_messages': summary_messages
                    })

                    if max_results and len(results) >= max_results * 2:
                        break

        return sorted(results, key=lambda x: x['score'], reverse=True)[:max_results] if max_results else sorted(results, key=lambda x: x['score'], reverse=True)

    def get_session_summary(self, result):
        """Generate a summary of what the conversation was about based on the first few messages."""
        summary_messages = result.get('summary_messages', [])

        if not summary_messages:
            return "No conversation summary available"

        # Look for the first substantive user message
        for msg in summary_messages:
            if msg['role'] in ['user', 'human']:
                content = msg['content'][:200]
                # Clean up the content
                content = content.replace('\n', ' ').strip()
                if len(content) > 30:
                    return f"User asked: {content}..." if len(msg['content']) > 200 else f"User asked: {content}"

        return "Conversation started with: " + summary_messages[0]['content'][:150].replace('\n', ' ') + "..."

    def get_resume_command(self, result):
        """Generate the Claude command to resume a session."""
        project_path = str(Path(self.claude_dir) / result['project'])

        # Check if it's a specific session file or project directory
        if result['session_id'] and result['session_id'] != result['project']:
            # Specific session
            return f"claude --project {project_path} --session {result['session_id']}"
        else:
            # Just the project
            return f"claude --project {project_path}"

    def display_results(self, results, keywords):
        """Display search results in a formatted way."""
        if not results:
            print(f"{Colors.YELLOW}No conversations found containing: {', '.join(keywords)} in user messages{Colors.ENDC}")
            return

        print(f"\n{Colors.BOLD}{Colors.GREEN}Found {len(results)} conversations (searching only in user messages){Colors.ENDC}")
        print(f"{Colors.CYAN}{'='*80}{Colors.ENDC}\n")

        for i, result in enumerate(results, 1):
            # Header
            print(f"{Colors.BOLD}{Colors.BLUE}[{i}] Project: {result['project']}{Colors.ENDC}")
            print(f"{Colors.DIM}    Session: {result['session_id']}{Colors.ENDC}")
            print(f"{Colors.DIM}    Modified: {result['timestamp']}{Colors.ENDC}")
            print(f"{Colors.DIM}    Score: {result['score']} matches{Colors.ENDC}")

            # Summary
            summary = self.get_session_summary(result)
            print(f"\n    {Colors.CYAN}{summary}{Colors.ENDC}")

            # Show matches with conversation context
            print(f"\n    {Colors.YELLOW}Conversation Context:{Colors.ENDC}\n")

            # Display only the first match for each keyword to keep output manageable
            shown_matches = set()
            for keyword, keyword_matches in result['matches'].items():
                if keyword_matches and keyword not in shown_matches:
                    shown_matches.add(keyword)
                    match = keyword_matches[0]  # Take first match

                    # Display the conversation context
                    for msg in match['context_messages']:
                        role = msg['role']
                        content = msg['content']

                        # Truncate very long messages
                        if len(content) > 500:
                            content = content[:500] + "..."

                        # Format role label
                        if role in ['user', 'human']:
                            role_label = f"{Colors.BOLD}{Colors.GREEN}USER:{Colors.ENDC}"
                        elif role in ['assistant', 'claude']:
                            role_label = f"{Colors.BOLD}{Colors.BLUE}CLAUDE:{Colors.ENDC}"
                        else:
                            role_label = f"{Colors.BOLD}{role.upper()}:{Colors.ENDC}"

                        # Highlight keyword in user messages
                        if role in ['user', 'human'] and keyword.lower() in content.lower():
                            # Highlight the keyword
                            import re
                            pattern = re.compile(re.escape(keyword), re.IGNORECASE)
                            content = pattern.sub(f"{Colors.BOLD}{Colors.YELLOW}\\g<0>{Colors.ENDC}", content)

                        # Print the message with proper indentation
                        lines = content.split('\n')
                        print(f"    {role_label} {lines[0]}")
                        for line in lines[1:]:
                            print(f"           {line}")
                        print()

                    # Only show one match example per result to keep output manageable
                    break

            # Resume command
            resume_cmd = self.get_resume_command(result)
            print(f"    {Colors.GREEN}Resume command:{Colors.ENDC}")
            print(f"    {Colors.BOLD}{resume_cmd}{Colors.ENDC}")

            print(f"\n{Colors.CYAN}{'-'*80}{Colors.ENDC}\n")

    def interactive_mode(self, results):
        """Allow user to select and open a conversation."""
        if not results:
            return

        while True:
            print(f"\n{Colors.YELLOW}Enter conversation number to resume (1-{len(results)}), or 'q' to quit:{Colors.ENDC} ", end='')
            choice = input().strip()

            if choice.lower() == 'q':
                break

            try:
                idx = int(choice) - 1
                if 0 <= idx < len(results):
                    resume_cmd = self.get_resume_command(results[idx])

                    print(f"\n{Colors.GREEN}Resuming conversation...{Colors.ENDC}")
                    print(f"{Colors.DIM}Running: {resume_cmd}{Colors.ENDC}\n")

                    # Copy command to clipboard if possible
                    try:
                        subprocess.run(['xclip', '-selection', 'clipboard'],
                                     input=resume_cmd.encode(), check=True)
                        print(f"{Colors.GREEN}Command copied to clipboard!{Colors.ENDC}")
                    except:
                        pass

                    # Ask if user wants to run the command
                    print(f"\n{Colors.YELLOW}Run this command now? (y/n):{Colors.ENDC} ", end='')
                    if input().strip().lower() == 'y':
                        os.system(resume_cmd)
                    break
                else:
                    print(f"{Colors.RED}Invalid number. Please enter 1-{len(results)}{Colors.ENDC}")
            except ValueError:
                print(f"{Colors.RED}Invalid input. Please enter a number or 'q'{Colors.ENDC}")

def main():
    parser = argparse.ArgumentParser(
        description='Search and resume Claude conversations',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "firebase" "authentication"     Search for conversations about Firebase auth
  %(prog)s -i "unity" "inspector"          Interactive mode to select and resume
  %(prog)s -r "debugging" -n 5             Show 5 most recent conversations about debugging
  %(prog)s --project "my-project" "api"    Search only in specific project
        """
    )

    # Arguments
    parser.add_argument('keywords', nargs='+', help='Keywords to search for in conversations')
    parser.add_argument('-d', '--directory', default='/home/jason/.claude/projects',
                       help='Claude projects directory (default: ~/.claude/projects)')
    parser.add_argument('-n', '--num-results', type=int, default=10,
                       help='Maximum number of results to show (default: 10)')
    parser.add_argument('-i', '--interactive', action='store_true',
                       help='Interactive mode - select conversation to resume')
    parser.add_argument('-r', '--recent', action='store_true',
                       help='Sort by most recent first')
    parser.add_argument('--project', help='Search only in specific project')
    parser.add_argument('--no-color', action='store_true',
                       help='Disable colored output')
    parser.add_argument('-v', '--verbose', action='store_true',
                       help='Show more context and details')

    args = parser.parse_args()

    # Disable colors if requested
    if args.no_color:
        for attr in dir(Colors):
            if not attr.startswith('__'):
                setattr(Colors, attr, '')

    # Initialize searcher
    search_dir = args.directory
    if args.project:
        search_dir = os.path.join(args.directory, args.project)

    searcher = ClaudeSessionSearcher(search_dir)

    # Search
    print(f"{Colors.CYAN}Searching for: {Colors.BOLD}{', '.join(args.keywords)}{Colors.ENDC}")
    print(f"{Colors.DIM}In: {search_dir}{Colors.ENDC}\n")

    results = searcher.search_sessions(args.keywords, max_results=args.num_results * 2)

    # Sort by recency if requested
    if args.recent:
        results.sort(key=lambda x: x['timestamp'], reverse=True)

    # Limit results
    results = results[:args.num_results]

    # Display results
    searcher.display_results(results, args.keywords)

    # Interactive mode
    if args.interactive and results:
        searcher.interactive_mode(results)

if __name__ == '__main__':
    main()