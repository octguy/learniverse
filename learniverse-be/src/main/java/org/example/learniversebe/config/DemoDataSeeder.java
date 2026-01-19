package org.example.learniversebe.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.enums.*;
import org.example.learniversebe.model.*;
import org.example.learniversebe.model.composite_key.ContentTagId;
import org.example.learniversebe.repository.*;
import org.example.learniversebe.util.SlugGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class DemoDataSeeder implements CommandLineRunner {

    @Value("${app.seed.enabled:false}")
    private boolean seedEnabled;

    private static final int TARGET_USERS = 100;
    private static final int GROUP_TARGET = 40;
    private static final int POSTS_PER_USER = 20;
    private static final int SHARE_PER_USER = 5;
    private static final int MIN_QUESTIONS = 10;
    private static final int MAX_QUESTIONS = 15;
    private static final int COMMENTS_PER_POST = 10;
    private static final int REACTIONS_PER_POST = 20;
    private static final int ANSWERS_PER_QUESTION = 20;
    private static final int VOTES_PER_ANSWER = 10;
    private static final int VOTES_PER_QUESTION = 8;
    private static final int FRIENDS_PER_USER = 20;
    private static final int CHAT_ROOMS_PER_USER = 5;
    private static final int GROUP_CHATS_PER_GROUP = 1;
    private static final int BOOKMARKS_PER_USER = 20;
    private static final int REPORTS_PER_USER = 5;
    private static final String DEFAULT_PASSWORD = "Password123!";

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AuthCredentialRepository authCredentialRepository;
    private final RoleRepository roleRepository;
    private final TagRepository tagRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupTagRepository groupTagRepository;
    private final ContentRepository contentRepository;
    private final ContentTagRepository contentTagRepository;
    private final AttachmentRepository attachmentRepository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final BookmarkRepository bookmarkRepository;
    private final AnswerRepository answerRepository;
    private final VoteRepository voteRepository;
    private final ShareRepository shareRepository;
    private final ReportRepository reportRepository;
    private final FriendRepository friendRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final PasswordEncoder passwordEncoder;
    private final SlugGenerator slugGenerator;

    private final Random random = new Random();

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedEnabled) {
            log.info("DemoDataSeeder disabled (app.seed.enabled=false)");
            return;
        }

        if (userRepository.count() >= TARGET_USERS) {
            log.info("DemoDataSeeder skipped because existing users >= {}", TARGET_USERS);
            return;
        }

        log.info("Starting demo data seeding...");

        Role userRole = ensureRole(UserRole.ROLE_USER);
        List<Tag> tags = ensureTags();

        List<User> users = seedUsers(userRole);
        Map<UUID, UserProfile> profileByUser = loadProfiles(users);
        Map<UUID, Set<UUID>> friendships = seedFriendships(users);
        List<Group> groups = seedGroups(users, tags, friendships);

        List<Content> posts = seedPosts(users, groups, tags, profileByUser);
        List<Content> sharedPosts = seedSharedPosts(users, posts, groups, profileByUser);
        List<Content> allPosts = new ArrayList<>();
        allPosts.addAll(posts);
        allPosts.addAll(sharedPosts);

        List<Content> questions = seedQuestions(users, tags, profileByUser);
        Map<UUID, List<Answer>> answersByQuestion = seedAnswers(users, questions, profileByUser);
        seedVotesForQuestions(questions, users);
        seedVotesForAnswers(answersByQuestion, users);

        seedComments(allPosts, users);
        seedReactions(allPosts, users);
        seedBookmarks(users, allPosts);
        seedReports(users, allPosts, answersByQuestion);
        seedChatRooms(users, friendships, groups);
        seedUserStats(profileByUser);

        logSampleCredentials(users);
        log.info("Demo data seeding finished.");
    }

    private Role ensureRole(UserRole roleName) {
        return roleRepository.findByName(roleName).orElseGet(() -> {
            Role role = new Role();
            role.setId(UUID.randomUUID());
            role.setName(roleName);
            LocalDateTime now = LocalDateTime.now();
            role.setCreatedAt(now);
            role.setUpdatedAt(now);
            return roleRepository.save(role);
        });
    }

    private List<Tag> ensureTags() {
        List<Tag> existing = tagRepository.findAll();
        if (!CollectionUtils.isEmpty(existing)) {
            return existing;
        }

        String[] defaultTags = new String[] {"toán", "vật lý", "hóa học", "lịch sử", "địa lý", "sinh học", "tiếng anh", "lập trình", "thiết kế", "trí tuệ nhân tạo", "điện toán đám mây", "cơ sở dữ liệu"};
        List<Tag> tags = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (String name : defaultTags) {
            Tag tag = new Tag();
            tag.setId(UUID.randomUUID());
            tag.setName(name);
            tag.setDescription("Auto seeded tag " + name);
            tag.setCreatedAt(now);
            tag.setUpdatedAt(now);
            tags.add(tag);
        }
        return tagRepository.saveAll(tags);
    }

    private List<User> seedUsers(Role userRole) {
        List<User> users = new ArrayList<>();
        List<AuthCredential> credentials = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 1; i <= TARGET_USERS; i++) {
            User user = new User();
            user.setId(UUID.randomUUID());
            user.setUsername("user" + String.format("%03d", i));
            user.setEmail("user" + String.format("%03d", i) + "@example.com");
            user.setEnabled(true);
            user.setStatus(UserStatus.ACTIVE);
            LocalDateTime createdAt = now.minusDays(random.nextInt(45));
            user.setCreatedAt(createdAt);
            user.setUpdatedAt(createdAt);
            user.setLastLoginAt(createdAt.plusDays(random.nextInt(10)));
            user.setOnboarded(true);
            user.addRole(userRole);
            users.add(user);

            AuthCredential credential = new AuthCredential();
            credential.setId(UUID.randomUUID());
            credential.setUser(user);
            credential.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
            credential.setCreatedAt(createdAt);
            credential.setUpdatedAt(createdAt);
            credentials.add(credential);
        }

        userRepository.saveAll(users);
        authCredentialRepository.saveAll(credentials);
        return users;
    }

    private Map<UUID, UserProfile> loadProfiles(List<User> users) {
        List<UserProfile> profiles = new ArrayList<>();
        for (User user : users) {
            UserProfile profile = new UserProfile();
            profile.setId(UUID.randomUUID());
            profile.setUser(user);
            profile.setDisplayName("User " + user.getUsername());
            profile.setBio("Demo profile for " + user.getUsername());
            profile.setAvatarUrl("https://i.pravatar.cc/150?img=" + random.nextInt(70));
            profile.setCoverUrl("https://picsum.photos/seed/cover" + user.getUsername() + "/1200/400");
            profiles.add(profile);
            user.setUserProfile(profile);
        }
        userProfileRepository.saveAll(profiles);
        return profiles.stream().collect(Collectors.toMap(p -> p.getUser().getId(), p -> p));
    }

    private Map<UUID, Set<UUID>> seedFriendships(List<User> users) {
        Map<UUID, Set<UUID>> graph = new HashMap<>();
        users.forEach(u -> graph.put(u.getId(), new HashSet<>()));

        Set<String> created = new HashSet<>();
        List<Friend> edges = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (User user : users) {
            while (graph.get(user.getId()).size() < FRIENDS_PER_USER) {
                User target = users.get(random.nextInt(users.size()));
                if (target.getId().equals(user.getId())) {
                    continue;
                }
                String key = sortedPairKey(user.getId(), target.getId());
                if (created.contains(key)) {
                    continue;
                }
                created.add(key);
                graph.get(user.getId()).add(target.getId());
                graph.get(target.getId()).add(user.getId());

                Friend friend = new Friend();
                friend.setUserId1(user.getId());
                friend.setUserId2(target.getId());
                friend.setActionUserId(random.nextBoolean() ? user.getId() : target.getId());
                friend.setStatus(FriendStatus.ACCEPTED);
                LocalDateTime createdAt = now.minusDays(random.nextInt(30));
                friend.setCreatedAt(createdAt);
                friend.setUpdatedAt(createdAt);
                edges.add(friend);
            }
        }

        friendRepository.saveAll(edges);
        return graph;
    }

    private List<Group> seedGroups(List<User> users, List<Tag> tags, Map<UUID, Set<UUID>> graph) {
        List<Group> groups = new ArrayList<>();
        List<GroupMember> members = new ArrayList<>();
        List<GroupTag> groupTags = new ArrayList<>();

        for (int i = 0; i < GROUP_TARGET; i++) {
            User creator = users.get(random.nextInt(users.size()));
            Group group = new Group();
            group.setId(UUID.randomUUID());
            String groupName = pickGroupName();
            group.setName(groupName);
            group.setSlug(slugGenerator.generateSlug(groupName + "-" + creator.getUsername()));
            group.setDescription(pickGroupDescription());
            group.setPrivacy(random.nextBoolean() ? GroupPrivacy.PUBLIC : GroupPrivacy.PRIVATE);
            group.setCreatedBy(creator);

            Set<GroupMember> memberSet = new HashSet<>();
            GroupMember owner = new GroupMember();
            owner.setId(UUID.randomUUID());
            owner.setGroup(group);
            owner.setUser(creator);
            owner.setRole(GroupMemberRole.OWNER);
            LocalDateTime ownerJoinedAt = LocalDateTime.now().minusDays(random.nextInt(30));
            owner.setJoinedAt(ownerJoinedAt);
            owner.setCreatedAt(ownerJoinedAt);
            owner.setUpdatedAt(ownerJoinedAt);
            memberSet.add(owner);
            members.add(owner);

            List<UUID> friendIds = new ArrayList<>(graph.getOrDefault(creator.getId(), new HashSet<>()));
            Collections.shuffle(friendIds);
            int limit = Math.min(10, friendIds.size());
            for (int j = 0; j < limit; j++) {
                UUID friendId = friendIds.get(j);
                User friend = users.stream().filter(u -> u.getId().equals(friendId)).findFirst().orElse(null);
                if (friend == null) continue;
                GroupMember gm = new GroupMember();
                gm.setId(UUID.randomUUID());
                gm.setGroup(group);
                gm.setUser(friend);
                gm.setRole(GroupMemberRole.MEMBER);
                LocalDateTime memberJoinedAt = ownerJoinedAt.plusDays(random.nextInt(5));
                gm.setJoinedAt(memberJoinedAt);
                gm.setCreatedAt(memberJoinedAt);
                gm.setUpdatedAt(memberJoinedAt);
                memberSet.add(gm);
                members.add(gm);
            }

            group.setMembers(memberSet);
            group.setMemberCount(memberSet.size());

            Tag pickedTag = tags.get(random.nextInt(tags.size()));
            GroupTag groupTag = new GroupTag();
            groupTag.setId(UUID.randomUUID());
            groupTag.setGroup(group);
            groupTag.setTag(pickedTag);
            groupTags.add(groupTag);

            groups.add(group);
        }

        groupRepository.saveAll(groups);
        groupMemberRepository.saveAll(members);
        groupTagRepository.saveAll(groupTags);
        return groups;
    }

    private List<Content> seedPosts(List<User> users, List<Group> groups, List<Tag> tags, Map<UUID, UserProfile> profileByUser) {
        List<Content> posts = new ArrayList<>();
        List<Attachment> attachments = new ArrayList<>();
        List<ContentTag> links = new ArrayList<>();

        for (User author : users) {
            for (int i = 0; i < POSTS_PER_USER - SHARE_PER_USER; i++) {
                Content post = new Content();
                post.setId(UUID.randomUUID());
                post.setAuthor(author);
                post.setContentType(ContentType.POST);
                post.setStatus(ContentStatus.PUBLISHED);
                boolean inGroup = random.nextDouble() < 0.3 && !groups.isEmpty();
                if (inGroup) {
                    Group group = groups.get(random.nextInt(groups.size()));
                    post.setGroup(group);
                    post.setVisibility(ContentVisibility.GROUP);
                } else {
                    post.setVisibility(ContentVisibility.PUBLIC);
                }
                post.setTitle(samplePostTitle(author));
                post.setBody(samplePostBody());
                post.setSlug(slugGenerator.generateSlug(post.getTitle() + "-" + author.getUsername()));
                post.setPublishedAt(LocalDateTime.now().minusDays(random.nextInt(20)));
                post.setViewCount(30 + random.nextInt(200));

                Set<Tag> chosen = pickTags(tags, 1 + random.nextInt(3));
                for (Tag tag : chosen) {
                    ContentTag link = new ContentTag();
                    link.setContentTagId(new ContentTagId(post.getId(), tag.getId()));
                    link.setContent(post);
                    link.setTag(tag);
                    link.setCreatedAt(post.getCreatedAt());
                    link.setUpdatedAt(post.getUpdatedAt());
                    links.add(link);
                    post.getContentTags().add(link);
                }

                Attachment image = new Attachment();
                image.setId(UUID.randomUUID());
                image.setContent(post);
                image.setUploadedBy(author);
                image.setFileName("post-" + i + "-" + author.getUsername() + ".jpg");
                image.setMimeType("image/jpeg");
                image.setFileType(AttachmentType.IMAGE);
                image.setFileSize(250_000L + random.nextInt(500_000));
                image.setStorageUrl("https://picsum.photos/seed/post" + post.getId() + "/800/600");
                image.setStorageKey("demo/post/image/" + post.getId());
                image.setIsVerified(true);
                attachments.add(image);
                post.getAttachments().add(image);

                Attachment doc = new Attachment();
                doc.setId(UUID.randomUUID());
                doc.setContent(post);
                doc.setUploadedBy(author);
                doc.setFileName("post-" + i + "-" + author.getUsername() + ".pdf");
                doc.setMimeType("application/pdf");
                doc.setFileType(AttachmentType.PDF);
                doc.setFileSize(500_000L + random.nextInt(1_000_000));
                doc.setStorageUrl("https://example.com/docs/post-" + post.getId() + ".pdf");
                doc.setStorageKey("demo/post/doc/" + post.getId());
                doc.setIsVerified(true);
                attachments.add(doc);
                post.getAttachments().add(doc);

                posts.add(post);
                incrementProfilePost(profileByUser, author.getId());
            }
        }

        contentRepository.saveAll(posts);
        contentTagRepository.saveAll(links);
        attachmentRepository.saveAll(attachments);
        return posts;
    }

    private List<Content> seedSharedPosts(List<User> users, List<Content> posts, List<Group> groups, Map<UUID, UserProfile> profileByUser) {
        List<Content> sharedPosts = new ArrayList<>();
        List<Share> shares = new ArrayList<>();
        if (posts.isEmpty()) {
            return sharedPosts;
        }

        // Ensure we use managed instances of original posts to avoid transient reference issues
        Map<UUID, Content> managedPosts = contentRepository.findAllById(posts.stream().map(Content::getId).collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(Content::getId, c -> c));

        for (User author : users) {
            Set<UUID> sharedContentIds = new HashSet<>();
            int created = 0;
            int attempts = 0;
            int maxAttempts = SHARE_PER_USER * 5;
            while (created < SHARE_PER_USER && attempts < maxAttempts) {
                attempts++;
                Content target = posts.get(random.nextInt(posts.size()));
                if (!sharedContentIds.add(target.getId())) {
                    continue;
                }
                Content shared = new Content();
                shared.setId(UUID.randomUUID());
                shared.setAuthor(author);
                shared.setContentType(ContentType.SHARED_POST);
                shared.setStatus(ContentStatus.PUBLISHED);
                shared.setOriginalContent(target);
                boolean inGroup = random.nextDouble() < 0.2 && !groups.isEmpty();
                if (inGroup) {
                    shared.setGroup(groups.get(random.nextInt(groups.size())));
                    shared.setVisibility(ContentVisibility.GROUP);
                } else {
                    shared.setVisibility(ContentVisibility.PUBLIC);
                }
                shared.setTitle("Chia sẻ: " + target.getTitle());
                shared.setBody(sampleShareBody(target));
                shared.setSlug(slugGenerator.generateSlug("share-" + target.getSlug() + "-" + author.getUsername() + "-" + created));
                shared.setPublishedAt(LocalDateTime.now().minusDays(random.nextInt(15)));
                shared.setViewCount(20 + random.nextInt(100));
                sharedPosts.add(shared);
                incrementProfilePost(profileByUser, author.getId());

                Share share = new Share();
                share.setContent(managedPosts.get(target.getId()));
                share.setSharedBy(author);
                share.setShareType(ShareType.NEWSFEED);
                shares.add(share);
                target.setShareCount(target.getShareCount() + 1);
                created++;
            }
        }

        contentRepository.saveAll(sharedPosts);
        contentRepository.flush();
        shareRepository.saveAll(shares);
        contentRepository.saveAll(posts);
        return sharedPosts;
    }

    private List<Content> seedQuestions(List<User> users, List<Tag> tags, Map<UUID, UserProfile> profileByUser) {
        List<Content> questions = new ArrayList<>();
        for (User author : users) {
            int questionCount = MIN_QUESTIONS + random.nextInt((MAX_QUESTIONS - MIN_QUESTIONS) + 1);
            for (int i = 0; i < questionCount; i++) {
                Content question = new Content();
                question.setId(UUID.randomUUID());
                question.setAuthor(author);
                question.setContentType(ContentType.QUESTION);
                question.setStatus(ContentStatus.PUBLISHED);
                question.setVisibility(random.nextDouble() < 0.2 ? ContentVisibility.FRIENDS_ONLY : ContentVisibility.PUBLIC);
                question.setTitle(sampleQuestionTitle());
                question.setBody(sampleQuestionBody());
                question.setSlug(slugGenerator.generateSlug(question.getTitle() + "-" + author.getUsername()));
                question.setPublishedAt(LocalDateTime.now().minusDays(random.nextInt(25)));
                question.setViewCount(40 + random.nextInt(200));

                Set<Tag> chosen = pickTags(tags, 2);
                for (Tag tag : chosen) {
                    ContentTag link = new ContentTag();
                    link.setContentTagId(new ContentTagId(question.getId(), tag.getId()));
                    link.setContent(question);
                    link.setTag(tag);
                    link.setCreatedAt(question.getCreatedAt());
                    link.setUpdatedAt(question.getUpdatedAt());
                    question.getContentTags().add(link);
                }

                questions.add(question);
                incrementProfileQuestion(profileByUser, author.getId());
            }
        }

        contentRepository.saveAll(questions);
        return questions;
    }

    private Map<UUID, List<Answer>> seedAnswers(List<User> users, List<Content> questions, Map<UUID, UserProfile> profileByUser) {
        Map<UUID, List<Answer>> answersByQuestion = new HashMap<>();
        List<Answer> allAnswers = new ArrayList<>();
        for (Content question : questions) {
            List<Answer> answers = new ArrayList<>();
            Set<UUID> usedAuthors = new HashSet<>();
            for (int i = 0; i < ANSWERS_PER_QUESTION; i++) {
                User author = users.get(random.nextInt(users.size()));
                if (usedAuthors.contains(author.getId())) {
                    // allow duplicate authors but keep distribution varied
                }
                Answer answer = new Answer();
                answer.setId(UUID.randomUUID());
                answer.setQuestion(question);
                answer.setAuthor(author);
                answer.setBody(sampleAnswer());
                answers.add(answer);
                allAnswers.add(answer);
                usedAuthors.add(author.getId());
                incrementProfileAnswered(profileByUser, author.getId());
            }
            answersByQuestion.put(question.getId(), answers);
            question.setAnswerCount(answers.size());

            Answer accepted = answers.get(random.nextInt(answers.size()));
            accepted.setIsAccepted(true);
            question.setAcceptedAnswer(accepted);
            question.setIsAnswered(true);
        }

        answerRepository.saveAll(allAnswers);
        contentRepository.saveAll(questions);
        return answersByQuestion;
    }

    private void seedVotesForQuestions(List<Content> questions, List<User> users) {
        List<Vote> votes = new ArrayList<>();
        for (Content question : questions) {
            Set<UUID> votedUsers = new HashSet<>();
            int upvotes = 0;
            int downvotes = 0;
            for (int i = 0; i < VOTES_PER_QUESTION; i++) {
                User voter = users.get(random.nextInt(users.size()));
                if (votedUsers.contains(voter.getId())) {
                    continue;
                }
                votedUsers.add(voter.getId());
                Vote vote = new Vote();
                vote.setId(UUID.randomUUID());
                vote.setVotableType(VotableType.CONTENT);
                vote.setVotableId(question.getId());
                vote.setUser(voter);
                VoteType type = random.nextDouble() < 0.8 ? VoteType.UPVOTE : VoteType.DOWNVOTE;
                vote.setVoteType(type);
                votes.add(vote);
                if (type == VoteType.UPVOTE) {
                    upvotes++;
                } else {
                    downvotes++;
                }
            }
            question.setVoteScore(upvotes - downvotes);
        }
        voteRepository.saveAll(votes);
        contentRepository.saveAll(questions);
    }

    private void seedVotesForAnswers(Map<UUID, List<Answer>> answersByQuestion, List<User> users) {
        List<Vote> votes = new ArrayList<>();
        for (List<Answer> answers : answersByQuestion.values()) {
            for (Answer answer : answers) {
                Set<UUID> votedUsers = new HashSet<>();
                int up = 0;
                int down = 0;
                for (int i = 0; i < VOTES_PER_ANSWER; i++) {
                    User voter = users.get(random.nextInt(users.size()));
                    if (votedUsers.contains(voter.getId())) {
                        continue;
                    }
                    votedUsers.add(voter.getId());
                    Vote vote = new Vote();
                    vote.setId(UUID.randomUUID());
                    vote.setVotableType(VotableType.ANSWER);
                    vote.setVotableId(answer.getId());
                    vote.setUser(voter);
                    VoteType type = random.nextDouble() < 0.85 ? VoteType.UPVOTE : VoteType.DOWNVOTE;
                    vote.setVoteType(type);
                    votes.add(vote);
                    if (type == VoteType.UPVOTE) {
                        up++;
                    } else {
                        down++;
                    }
                }
                answer.setUpvoteCount(up);
                answer.setDownvoteCount(down);
                answer.setVoteScore(up - down);
            }
        }
        voteRepository.saveAll(votes);
        answerRepository.saveAll(answersByQuestion.values().stream().flatMap(Collection::stream).collect(Collectors.toList()));
    }

    private void seedComments(List<Content> posts, List<User> users) {
        List<Comment> comments = new ArrayList<>();
        for (Content post : posts) {
            for (int i = 0; i < COMMENTS_PER_POST; i++) {
                User author = users.get(random.nextInt(users.size()));
                Comment comment = new Comment();
                comment.setId(UUID.randomUUID());
                comment.setAuthor(author);
                comment.setCommentableType(ReactableType.CONTENT);
                comment.setCommentableId(post.getId());
                comment.setBody(sampleComment());
                comments.add(comment);
            }
            post.setCommentCount(COMMENTS_PER_POST);
        }
        commentRepository.saveAll(comments);
        contentRepository.saveAll(posts);
    }

    private void seedReactions(List<Content> posts, List<User> users) {
        List<Reaction> reactions = new ArrayList<>();
        for (Content post : posts) {
            Set<UUID> reactedUsers = new HashSet<>();
            for (int i = 0; i < REACTIONS_PER_POST; i++) {
                User reactor = users.get(random.nextInt(users.size()));
                if (reactedUsers.contains(reactor.getId())) {
                    continue;
                }
                reactedUsers.add(reactor.getId());
                Reaction reaction = new Reaction();
                reaction.setId(UUID.randomUUID());
                reaction.setReactableType(ReactableType.CONTENT);
                reaction.setReactableId(post.getId());
                reaction.setUser(reactor);
                reaction.setReactionType(pickReaction());
                reactions.add(reaction);
            }
            post.setReactionCount(reactedUsers.size());
        }
        reactionRepository.saveAll(reactions);
        contentRepository.saveAll(posts);
    }

    private void seedBookmarks(List<User> users, List<Content> posts) {
        List<Bookmark> bookmarks = new ArrayList<>();
        for (User user : users) {
            Set<UUID> bookmarked = new HashSet<>();
            for (int i = 0; i < BOOKMARKS_PER_USER; i++) {
                Content post = posts.get(random.nextInt(posts.size()));
                if (bookmarked.contains(post.getId())) {
                    continue;
                }
                bookmarked.add(post.getId());
                Bookmark bm = new Bookmark();
                bm.setId(UUID.randomUUID());
                bm.setUser(user);
                bm.setContent(post);
                bm.setCollectionName("Yêu thích");
                bm.setNotes("Đánh dấu để xem lại");
                bookmarks.add(bm);
                post.setBookmarkCount(post.getBookmarkCount() + 1);
            }
        }
        bookmarkRepository.saveAll(bookmarks);
        contentRepository.saveAll(posts);
    }

    private void seedReports(List<User> users, List<Content> posts, Map<UUID, List<Answer>> answersByQuestion) {
        List<Report> reports = new ArrayList<>();
        List<Answer> allAnswers = answersByQuestion.values().stream().flatMap(Collection::stream).collect(Collectors.toList());
        for (User reporter : users) {
            for (int i = 0; i < REPORTS_PER_USER; i++) {
                double pick = random.nextDouble();
                Report report = new Report();
                report.setReporter(reporter);
                if (pick < 0.4) {
                    Content post = posts.get(random.nextInt(posts.size()));
                    report.setReportableType(post.getContentType() == ContentType.QUESTION ? ReportableType.QUESTION : ReportableType.POST);
                    report.setReportableId(post.getId());
                } else if (pick < 0.8 && !allAnswers.isEmpty()) {
                    Answer answer = allAnswers.get(random.nextInt(allAnswers.size()));
                    report.setReportableType(ReportableType.ANSWER);
                    report.setReportableId(answer.getId());
                } else {
                    Content post = posts.get(random.nextInt(posts.size()));
                    report.setReportableType(ReportableType.POST);
                    report.setReportableId(post.getId());
                }
                report.setReason(ReportReason.values()[random.nextInt(ReportReason.values().length)]);
                report.setDescription("Báo cáo tự động để kiểm thử");
                reports.add(report);
            }
        }
        reportRepository.saveAll(reports);
    }

    private void seedChatRooms(List<User> users, Map<UUID, Set<UUID>> graph, List<Group> groups) {
        List<ChatRoom> rooms = new ArrayList<>();
        List<ChatParticipant> participants = new ArrayList<>();
        List<ChatMessage> messages = new ArrayList<>();
        Set<String> created = new HashSet<>();

        for (User user : users) {
            List<UUID> friendIds = new ArrayList<>(graph.getOrDefault(user.getId(), Collections.emptySet()));
            Collections.shuffle(friendIds);
            int limit = Math.min(CHAT_ROOMS_PER_USER, friendIds.size());
            for (int i = 0; i < limit; i++) {
                UUID friendId = friendIds.get(i);
                String key = sortedPairKey(user.getId(), friendId);
                if (created.contains(key)) {
                    continue;
                }
                created.add(key);
                User friend = users.stream().filter(u -> u.getId().equals(friendId)).findFirst().orElse(null);
                if (friend == null) continue;

                ChatRoom room = new ChatRoom();
                room.setHost(user);
                room.setName("Chat " + user.getUsername() + " & " + friend.getUsername());
                room.setGroupChat(false);
                rooms.add(room);

                ChatParticipant p1 = new ChatParticipant();
                p1.setChatRoom(room);
                p1.setParticipant(user);
                p1.setInvitedBy(user);
                p1.setChatRole(GroupChatRole.ADMIN);
                participants.add(p1);

                ChatParticipant p2 = new ChatParticipant();
                p2.setChatRoom(room);
                p2.setParticipant(friend);
                p2.setInvitedBy(user);
                p2.setChatRole(GroupChatRole.MEMBER);
                participants.add(p2);

                for (int m = 0; m < 20; m++) {
                    ChatMessage msg = new ChatMessage();
                    msg.setChatRoom(room);
                    boolean fromUser = m % 2 == 0;
                    msg.setSender(fromUser ? user : friend);
                    msg.setMessageType(MessageType.TEXT);
                    msg.setTextContent(sampleChatMessage());
                    messages.add(msg);
                }
            }
        }

        seedGroupChats(groups, rooms, participants, messages);

        chatRoomRepository.saveAll(rooms);
        chatParticipantRepository.saveAll(participants);
        chatMessageRepository.saveAll(messages);
    }

    private void seedGroupChats(List<Group> groups, List<ChatRoom> rooms, List<ChatParticipant> participants, List<ChatMessage> messages) {
        if (groups.isEmpty()) {
            return;
        }

        for (Group group : groups) {
            if (group.getMembers() == null || group.getMembers().size() < 3) {
                continue;
            }

            for (int i = 0; i < GROUP_CHATS_PER_GROUP; i++) {
                ChatRoom room = new ChatRoom();
                room.setHost(group.getCreatedBy());
                room.setGroupChat(true);
                room.setName("Nhóm chat: " + group.getName());
                rooms.add(room);

                List<GroupMember> memberList = new ArrayList<>(group.getMembers());
                Collections.shuffle(memberList);
                int memberLimit = Math.min(12, memberList.size());
                List<ChatParticipant> roomParticipants = new ArrayList<>();
                for (int m = 0; m < memberLimit; m++) {
                    GroupMember gm = memberList.get(m);
                    ChatParticipant participant = new ChatParticipant();
                    participant.setChatRoom(room);
                    participant.setParticipant(gm.getUser());
                    participant.setInvitedBy(group.getCreatedBy());
                    participant.setChatRole(gm.getRole() == GroupMemberRole.OWNER ? GroupChatRole.ADMIN : GroupChatRole.MEMBER);
                    participant.setJoinedAt(gm.getJoinedAt());
                    participant.setLastReadAt(LocalDateTime.now().minusDays(random.nextInt(3)));
                    participants.add(participant);
                    roomParticipants.add(participant);
                }

                if (roomParticipants.isEmpty()) {
                    continue;
                }

                for (int m = 0; m < 30; m++) {
                    ChatMessage msg = new ChatMessage();
                    msg.setChatRoom(room);
                    ChatParticipant sender = roomParticipants.get(random.nextInt(roomParticipants.size()));
                    msg.setSender(sender.getParticipant());
                    msg.setMessageType(MessageType.TEXT);
                    msg.setTextContent(sampleChatMessage());
                    messages.add(msg);
                }
            }
        }
    }

    private void seedUserStats(Map<UUID, UserProfile> profileByUser) {
        userProfileRepository.saveAll(profileByUser.values());
    }

    private void logSampleCredentials(List<User> users) {
        String creds = users.stream().limit(5).map(u -> u.getEmail() + " / " + DEFAULT_PASSWORD).collect(Collectors.joining(" | "));
        log.info("Sample login accounts: {}", creds);
    }

    private void incrementProfilePost(Map<UUID, UserProfile> profileByUser, UUID userId) {
        UserProfile profile = profileByUser.get(userId);
        if (profile != null) {
            profile.setPostCount(profile.getPostCount() + 1);
        }
    }

    private void incrementProfileQuestion(Map<UUID, UserProfile> profileByUser, UUID userId) {
        UserProfile profile = profileByUser.get(userId);
        if (profile != null) {
            profile.setPostCount(profile.getPostCount() + 1);
        }
    }

    private void incrementProfileAnswered(Map<UUID, UserProfile> profileByUser, UUID userId) {
        UserProfile profile = profileByUser.get(userId);
        if (profile != null) {
            profile.setAnsweredQuestionCount(profile.getAnsweredQuestionCount() + 1);
        }
    }

    private String sortedPairKey(UUID a, UUID b) {
        return a.compareTo(b) < 0 ? a + "-" + b : b + "-" + a;
    }

    private Set<Tag> pickTags(List<Tag> tags, int max) {
        Set<Tag> picked = new HashSet<>();
        List<Tag> copy = new ArrayList<>(tags);
        Collections.shuffle(copy);
        for (int i = 0; i < Math.min(max, copy.size()); i++) {
            picked.add(copy.get(i));
        }
        return picked;
    }

    private ReactionType pickReaction() {
        ReactionType[] values = ReactionType.values();
        return values[random.nextInt(values.length)];
    }

    private String samplePostTitle(User author) {
        String[] options = new String[] {
                "Nhật ký học tập của %s",
                "Checklist ôn tập cuối tuần",
                "Mini note: kiến thức vừa học",
                "Chia sẻ tài liệu mình đang dùng",
                "Kinh nghiệm thoát deadline nhưng vẫn ngủ đủ",
                "Ý tưởng dự án nhỏ để luyện tay",
                "Tóm tắt nhanh buổi học hôm nay",
                "Góc tự học của %s",
                "Lịch học gọn trong 7 ngày",
                "Ghi chú cấp tốc cho chương mới"
        };
        String template = pick(options);
        return template.contains("%s") ? String.format(template, author.getUsername()) : template;
    }

    private String samplePostBody() {
        String[] options = new String[] {
                "Mình thử chia kiến thức thành từng mảnh nhỏ, học trong 30 phút rồi nghỉ 5 phút. Thấy đỡ nản và vào đầu hơn hẳn. Ai muốn thử thì comment nhé!",
                "Tối qua thử Pomodoro 25/5, cộng thêm viết lại ý chính ra giấy. Sáng nay nhớ được kha khá, recommend cho ai đang ôn gấp.",
                "Mình gom vài link tài liệu chất lượng, có cả quiz nhỏ để tự check. Hy vọng giúp mọi người đỡ mò mẫm.",
                "Chia sẻ bảng checklist mỗi ngày: 1 bài tập, 1 video ngắn, 15 phút flashcard. Làm đều thấy tiến bộ rõ.",
                "Đang luyện dự án mini, cố gắng mỗi ngày push một chút. Kỷ luật nhỏ nhưng vui phết, ai có tip tối ưu thời gian nữa không?"
        };
        return pick(options);
    }

    private String sampleShareBody(Content target) {
        String[] options = new String[] {
                "Bài \"%s\" đọc khá dễ hiểu, mình chia sẻ lại cho mọi người cùng xem.",
                "Lướt thấy bài \"%s\" hợp với nhu cầu ôn của mình, share để anh em tham khảo.",
                "Thấy ý chính trong \"%s\" khá ổn, bookmark và chia sẻ cho team.",
                "Ai đang bí thì thử đọc \"%s\", mình thấy có vài mẹo áp dụng được ngay."
        };
        return String.format(pick(options), target.getTitle());
    }

    private String sampleQuestionTitle() {
        String[] options = new String[] {
                "Làm sao nhớ công thức nhanh mà không phải học vẹt?",
                "Có lịch ôn Java 4 tuần nào gọn không?",
                "Cách ghi chú hiệu quả cho người hay quên?",
                "Học nhóm online thì nên chia việc thế nào?",
                "Mọi người luyện nghe tiếng Anh mỗi ngày ra sao?",
                "Làm thế nào để không sợ bài tập lớn?",
                "Có tips nào để đọc tài liệu tiếng Anh nhanh hơn?",
                "Ôn thi trắc nghiệm nên bắt đầu từ đâu?",
                "Cách quản lý thời gian khi vừa đi làm vừa học thêm?",
                "Muốn bắt đầu Data Analyst thì học gì trước?"
        };
        return pick(options);
    }

    private String sampleQuestionBody() {
        String[] options = new String[] {
                "Mình hay quên công thức sau vài ngày. Có ai có cách nào nhớ lâu hơn không? Flashcard hay mindmap cái nào hiệu quả hơn?",
                "Đang tự học Java, muốn có lộ trình ngắn khoảng 1 tháng để nắm core trước. Mọi người chia sẻ giúp giáo trình hoặc playlist uy tín với.",
                "Học nhóm online 3 người mà hay lệch nhịp, có tips chia task hoặc lịch họp để đỡ trễ không?",
                "Khi đọc tài liệu tiếng Anh, mình mất thời gian tra từ. Có plugin hay workflow nào giúp đọc nhanh hơn không?",
                "Vừa đi làm vừa học thêm chứng chỉ, mọi người sắp xếp giờ giấc thế nào để không kiệt sức?"
        };
        return pick(options);
    }

    private String sampleAnswer() {
        String[] options = new String[] {
                "Chia nhỏ kiến thức, mỗi phần viết lại bằng lời của mình rồi dạy thử cho bạn khác. Nhớ lâu hơn nhiều.",
                "Dùng flashcard + lặp lại ngắt quãng (Anki). Mỗi ngày 15 phút nhưng giữ được kiến thức khá ổn.",
                "Khi học nhóm, cố gắng kết thúc buổi bằng 5 phút tổng hợp: ai làm gì, deadline khi nào. Đỡ quên và đỡ trễ.",
                "Đọc tài liệu tiếng Anh thì bật chế độ reader, highlight từ khó và ghi chú ngay. Sau 2-3 lần sẽ quen nhịp.",
                "Đi làm về mệt thì đặt mục tiêu nhỏ thôi: 1 bài tập ngắn hoặc 1 video 10 phút. Quan trọng là giữ nhịp mỗi ngày."
        };
        return pick(options);
    }

    private String sampleComment() {
        String[] options = new String[] {
                "Hay quá, cảm ơn bạn!",
                "Ý này hợp lý nè.",
                "Để mình thử cách này xem sao.",
                "Bạn có thể chia sẻ thêm tài liệu không?",
                "Đọc xong thấy có động lực hẳn."};
        return pick(options);
    }

    private String sampleChatMessage() {
        String[] options = new String[] {
                "Chiều nay call 15 phút bàn bài tập nhé?",
                "Mình vừa push code, vào review giúp với.",
                "Ai còn thiếu tài liệu thì ping mình gửi.",
                "Làm xong quiz chưa, chia sẻ điểm xem nào?",
                "Tối nay học chung không, mình đang rảnh."};
        return pick(options);
    }

    private String pickGroupName() {
        String[] options = new String[] {
                "CLB Ôn Thi Cấp Tốc",
                "Cà Phê Kiến Thức",
                "Team Luyện Đề IT",
                "Hội Chép Bài Xịn",
                "Study & Chill",
                "Hẹn Hò Cùng Deadline",
                "Xưởng Bài Tập Chất Lượng",
                "Tối Thứ Bảy Học Gì",
                "Đường Đua GPA 4.0",
                "Hội Người Thích Điểm Cao"
        };
        return pick(options);
    }

    private String pickGroupDescription() {
        String[] options = new String[] {
                "Chia sẻ tài liệu, quiz, mẹo ôn thi nhanh gọn.",
                "Mỗi ngày một tip học tập, nhẹ nhàng mà hiệu quả.",
                "Học nhóm, luyện đề và nhắc nhau giữ kỷ luật.",
                "Cùng nhau đạt điểm cao nhưng vẫn ngủ đủ giấc.",
                "Tối nay học gì? Vào đây bàn nhanh rồi làm liền."};
        return pick(options);
    }

    private String pick(String[] options) {
        return options[random.nextInt(options.length)];
    }
}
