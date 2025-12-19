#!/bin/bash

# Message Receipts Module - Comprehensive Test Script
# Tests all endpoints and functionality of the message receipts feature

BASE_URL="http://localhost:8080"
TESTS_PASSED=0
TESTS_FAILED=0

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_section() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_test() {
    echo ""
    echo -e "${YELLOW}[TEST $1] $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_response_status() {
    local response=$1
    local expected_status=$2
    
    if echo "$response" | grep -q "\"status\":\"$expected_status\""; then
        return 0
    else
        return 1
    fi
}

# Start tests
print_section "MESSAGE RECEIPTS MODULE - COMPREHENSIVE TEST SUITE"
echo "Base URL: $BASE_URL"
echo "Date: $(date)"

# Test 1: Login User 1
print_test "1/11" "Login User 1 (Sender)"
USER1_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"heyiamthinh1003@gmail.com","password":"123456A@"}')

if check_response_status "$USER1_RESPONSE" "success"; then
    USER1_TOKEN=$(echo "$USER1_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)
    USER1_ID=$(echo "$USER1_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
    print_success "User 1 logged in successfully (ID: ${USER1_ID:0:8}...)"
else
    print_error "User 1 login failed"
    echo "$USER1_RESPONSE" | python3 -m json.tool
    exit 1
fi

# Test 2: Login User 2
print_test "2/11" "Login User 2 (Recipient)"
USER2_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"abc@gmail.com","password":"123456A@"}')

if check_response_status "$USER2_RESPONSE" "success"; then
    USER2_TOKEN=$(echo "$USER2_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)
    USER2_ID=$(echo "$USER2_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
    print_success "User 2 logged in successfully (ID: ${USER2_ID:0:8}...)"
else
    print_error "User 2 login failed"
    echo "$USER2_RESPONSE" | python3 -m json.tool
    exit 1
fi

# Test 3: Create Direct Chat
print_test "3/11" "Create Direct Chat Room"
CHAT_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/chats/direct/${USER2_ID}" \
  -H "Authorization: Bearer ${USER1_TOKEN}" \
  -H "Content-Type: application/json")

if check_response_status "$CHAT_RESPONSE" "success"; then
    CHAT_ID=$(echo "$CHAT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
    print_success "Chat room created (ID: ${CHAT_ID:0:8}...)"
elif echo "$CHAT_RESPONSE" | grep -q "already exists"; then
    print_info "Chat room already exists, fetching existing chat..."
    # Get the existing direct chat
    EXISTING_CHAT=$(curl -s -X GET "${BASE_URL}/api/v1/chats/direct" \
      -H "Authorization: Bearer ${USER1_TOKEN}")
    
    # Find chat with user 2
    CHAT_ID=$(echo "$EXISTING_CHAT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('status') == 'success' and data.get('data'):
    for chat in data['data']:
        # Check if user2 is in participants (participants is array of IDs)
        if '${USER2_ID}' in chat.get('participants', []):
            print(chat['id'])
            break
" 2>/dev/null)
    
    if [ -n "$CHAT_ID" ]; then
        print_success "Using existing chat room (ID: ${CHAT_ID:0:8}...)"
    else
        print_error "Could not find existing chat room"
        exit 1
    fi
else
    print_error "Failed to create or find chat room"
    echo "$CHAT_RESPONSE" | python3 -m json.tool
    exit 1
fi

# Test 4: Send First Message
print_test "4/11" "Send First Message"
MSG1_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/messages/send" \
  -H "Authorization: Bearer ${USER1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"chatRoomId\": \"${CHAT_ID}\",
    \"messageType\": \"TEXT\",
    \"textContent\": \"Hello! This is test message 1 for receipts.\"
  }")

if check_response_status "$MSG1_RESPONSE" "success"; then
    MSG1_ID=$(echo "$MSG1_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
    print_success "Message 1 sent (ID: ${MSG1_ID:0:8}...)"
else
    print_error "Failed to send message 1"
    echo "$MSG1_RESPONSE" | python3 -m json.tool
    exit 1
fi

# Test 5: Send Second Message
print_test "5/11" "Send Second Message"
MSG2_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/messages/send" \
  -H "Authorization: Bearer ${USER1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"chatRoomId\": \"${CHAT_ID}\",
    \"messageType\": \"TEXT\",
    \"textContent\": \"This is test message 2.\"
  }")

if check_response_status "$MSG2_RESPONSE" "success"; then
    MSG2_ID=$(echo "$MSG2_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
    print_success "Message 2 sent (ID: ${MSG2_ID:0:8}...)"
else
    print_error "Failed to send message 2"
    exit 1
fi

# Test 6: Send Third Message
print_test "6/11" "Send Third Message"
MSG3_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/messages/send" \
  -H "Authorization: Bearer ${USER1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"chatRoomId\": \"${CHAT_ID}\",
    \"messageType\": \"TEXT\",
    \"textContent\": \"This is test message 3.\"
  }")

if check_response_status "$MSG3_RESPONSE" "success"; then
    MSG3_ID=$(echo "$MSG3_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
    print_success "Message 3 sent (ID: ${MSG3_ID:0:8}...)"
else
    print_error "Failed to send message 3"
    exit 1
fi

# Test 7: Check Initial Unread Count
print_test "7/11" "Check Initial Unread Count for User 2"
UNREAD1_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/v1/messages/receipts/unread/count?chatRoomId=${CHAT_ID}" \
  -H "Authorization: Bearer ${USER2_TOKEN}")

if check_response_status "$UNREAD1_RESPONSE" "success"; then
    UNREAD_COUNT=$(echo "$UNREAD1_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['unreadCount'])" 2>/dev/null)
    print_success "Unread count retrieved: $UNREAD_COUNT messages"
    if [ "$UNREAD_COUNT" -ge 3 ]; then
        print_info "Correct: User 2 has $UNREAD_COUNT unread messages"
    else
        print_error "Expected at least 3 unread messages, got $UNREAD_COUNT"
    fi
else
    print_error "Failed to get unread count"
    echo "$UNREAD1_RESPONSE" | python3 -m json.tool
fi

# Test 8: Get Unread Message IDs
print_test "8/11" "Get Unread Message IDs"
UNREAD_IDS_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/v1/messages/receipts/unread/messages?chatRoomId=${CHAT_ID}" \
  -H "Authorization: Bearer ${USER2_TOKEN}")

if check_response_status "$UNREAD_IDS_RESPONSE" "success"; then
    print_success "Unread message IDs retrieved"
    print_info "Response: $(echo "$UNREAD_IDS_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['data']['messageIds'][:2])" 2>/dev/null)..."
else
    print_error "Failed to get unread message IDs"
    echo "$UNREAD_IDS_RESPONSE" | python3 -m json.tool
fi

# Test 9: Mark Single Message as Read
print_test "9/11" "Mark Single Message as Read (Message 1)"
READ1_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/messages/receipts/read/${MSG1_ID}" \
  -H "Authorization: Bearer ${USER2_TOKEN}" \
  -H "Content-Type: application/json")

if check_response_status "$READ1_RESPONSE" "success"; then
    print_success "Message 1 marked as read"
    IS_READ=$(echo "$READ1_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['isRead'])" 2>/dev/null)
    READ_AT=$(echo "$READ1_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['readAt'])" 2>/dev/null)
    print_info "Read status: $IS_READ, Read at: $READ_AT"
else
    print_error "Failed to mark message 1 as read"
    echo "$READ1_RESPONSE" | python3 -m json.tool
fi

# Test 10: Mark Multiple Messages as Read
print_test "10/11" "Mark Multiple Messages as Read (Messages 2 & 3)"
MULTI_READ_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/messages/receipts/read/multiple" \
  -H "Authorization: Bearer ${USER2_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"messageIds\": [\"${MSG2_ID}\", \"${MSG3_ID}\"]}")

if check_response_status "$MULTI_READ_RESPONSE" "success"; then
    MARKED_COUNT=$(echo "$MULTI_READ_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['markedCount'])" 2>/dev/null)
    print_success "Multiple messages marked as read (Count: $MARKED_COUNT)"
else
    print_error "Failed to mark multiple messages as read"
    echo "$MULTI_READ_RESPONSE" | python3 -m json.tool
fi

# Test 11: Verify Unread Count is Zero
print_test "11/11" "Verify Unread Count After Reading All Messages"
UNREAD2_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/v1/messages/receipts/unread/count?chatRoomId=${CHAT_ID}" \
  -H "Authorization: Bearer ${USER2_TOKEN}")

if check_response_status "$UNREAD2_RESPONSE" "success"; then
    FINAL_UNREAD=$(echo "$UNREAD2_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['unreadCount'])" 2>/dev/null)
    if [ "$FINAL_UNREAD" -eq 0 ]; then
        print_success "Unread count is now $FINAL_UNREAD (all messages read)"
    else
        print_error "Expected 0 unread messages, got $FINAL_UNREAD"
    fi
else
    print_error "Failed to get final unread count"
    echo "$UNREAD2_RESPONSE" | python3 -m json.tool
fi

# Additional Test: Get All Receipts for Message 1
print_section "ADDITIONAL TESTS"

print_test "BONUS 1" "Get All Receipts for Message 1"
RECEIPTS_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/v1/messages/receipts/${MSG1_ID}" \
  -H "Authorization: Bearer ${USER1_TOKEN}")

if check_response_status "$RECEIPTS_RESPONSE" "success"; then
    print_success "Message receipts retrieved"
    echo "$RECEIPTS_RESPONSE" | python3 -m json.tool
else
    print_error "Failed to get message receipts"
    echo "$RECEIPTS_RESPONSE" | python3 -m json.tool
fi

# Test mark all as read functionality
print_test "BONUS 2" "Test Mark All as Read in Chat Room"

# Send one more message
MSG4_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/messages/send" \
  -H "Authorization: Bearer ${USER1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"chatRoomId\": \"${CHAT_ID}\",
    \"messageType\": \"TEXT\",
    \"textContent\": \"Final test message.\"
  }")

if check_response_status "$MSG4_RESPONSE" "success"; then
    print_info "Sent additional message"
    
    # Mark all as read
    MARK_ALL_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/messages/receipts/read-all?chatRoomId=${CHAT_ID}" \
      -H "Authorization: Bearer ${USER2_TOKEN}")
    
    if check_response_status "$MARK_ALL_RESPONSE" "success"; then
        MARKED_ALL_COUNT=$(echo "$MARK_ALL_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['markedCount'])" 2>/dev/null)
        print_success "Mark all as read succeeded (Marked: $MARKED_ALL_COUNT messages)"
    else
        print_error "Failed to mark all as read"
        echo "$MARK_ALL_RESPONSE" | python3 -m json.tool
    fi
else
    print_info "Could not send additional message for mark-all test"
fi

# Test Summary
print_section "TEST SUMMARY"
echo ""
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Message Receipts module is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED. Please review the output above.${NC}"
    exit 1
fi
