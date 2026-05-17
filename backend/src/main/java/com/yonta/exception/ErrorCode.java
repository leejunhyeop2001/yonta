package com.yonta.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Auth
    INVALID_EMAIL_DOMAIN(HttpStatus.BAD_REQUEST, "A001", "@yonsei.ac.kr 메일만 사용할 수 있습니다."),
    VERIFICATION_CODE_EXPIRED(HttpStatus.BAD_REQUEST, "A002", "인증 번호가 만료되었습니다. 다시 요청해주세요."),
    VERIFICATION_CODE_MISMATCH(HttpStatus.BAD_REQUEST, "A003", "인증 번호가 일치하지 않습니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "A004", "이미 회원가입한 상태입니다. 로그인해주세요."),
    DUPLICATE_STUDENT_ID(HttpStatus.CONFLICT, "A005", "이미 가입된 학번입니다."),
    EMAIL_SEND_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "A006", "인증 메일 발송에 실패했습니다."),
    EMAIL_NOT_VERIFIED(HttpStatus.FORBIDDEN, "A007", "이메일 인증이 완료되지 않았습니다."),
    TOO_MANY_REQUESTS(HttpStatus.TOO_MANY_REQUESTS, "A008", "잠시 후 다시 요청해주세요. (1분 제한)"),
    INVALID_AUTH_HEADER(HttpStatus.UNAUTHORIZED, "A009", "로그인이 필요합니다."),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U001", "사용자를 찾을 수 없습니다."),
    INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "U002", "비밀번호가 일치하지 않습니다."),
    USER_SUSPENDED(HttpStatus.FORBIDDEN, "U003", "이용 정지 상태입니다. 정지 해제 후 다시 이용해주세요."),

    // TaxiParty
    PARTY_NOT_FOUND(HttpStatus.NOT_FOUND, "P001", "합승 파티를 찾을 수 없습니다."),
    PARTY_FULL(HttpStatus.CONFLICT, "P002", "파티 인원이 가득 찼습니다."),
    PARTY_NOT_JOINABLE(HttpStatus.BAD_REQUEST, "P003", "참여할 수 없는 파티입니다."),
    ALREADY_JOINED(HttpStatus.CONFLICT, "P004", "이미 참여한 파티입니다."),
    INVALID_TIME_SLOT(HttpStatus.BAD_REQUEST, "P005", "출발 시간은 10분 단위로만 설정할 수 있습니다."),
    SAME_DEPARTURE_DESTINATION(HttpStatus.BAD_REQUEST, "P006", "출발지와 목적지가 같을 수 없습니다."),
    PAST_DEPARTURE_TIME(HttpStatus.BAD_REQUEST, "P007", "과거 시간으로는 파티를 생성할 수 없습니다."),
    INVALID_MAX_COUNT(HttpStatus.BAD_REQUEST, "P008", "최대 인원은 2~4명이어야 합니다."),
    PARTY_HOST_CANNOT_LEAVE(HttpStatus.BAD_REQUEST, "P009", "방장은 먼저 방장을 위임한 후 나가주세요."),
    NOT_PARTY_HOST(HttpStatus.FORBIDDEN, "P013", "방장만 수행할 수 있는 기능입니다."),
    PARTY_NOT_EMPTY(HttpStatus.BAD_REQUEST, "P014", "파티에 다른 멤버가 있어 해산할 수 없습니다. 방장을 위임해주세요."),
    TRANSFER_TARGET_NOT_IN_PARTY(HttpStatus.BAD_REQUEST, "P015", "위임 대상이 파티에 참여하고 있지 않습니다."),
    INVALID_PARTY_OPTION(HttpStatus.BAD_REQUEST, "P010", "파티 옵션 값이 올바르지 않습니다."),
    PARTY_REVIEW_NOT_AVAILABLE(HttpStatus.BAD_REQUEST, "P011", "지난 파티에 대해서만 평가를 남길 수 있습니다."),
    PARTY_ALREADY_REVIEWED(HttpStatus.CONFLICT, "P012", "이미 해당 파티에 대한 평가를 남겼습니다."),
    CHAT_NOT_MEMBER(HttpStatus.FORBIDDEN, "P016", "파티 멤버만 채팅에 참여할 수 있습니다."),
    MEMBER_ALREADY_REVIEWED(HttpStatus.CONFLICT, "P017", "이미 해당 멤버를 평가했습니다."),
    REVIEW_TARGET_NOT_IN_PARTY(HttpStatus.BAD_REQUEST, "P018", "같은 파티에 참여한 멤버만 평가/신고할 수 있습니다."),
    CANNOT_REPORT_SELF(HttpStatus.BAD_REQUEST, "P019", "본인은 신고할 수 없습니다."),
    NO_SHOW_ALREADY_REPORTED(HttpStatus.CONFLICT, "P020", "이미 해당 사용자를 노쇼 신고했습니다."),

    // Notification
    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "N001", "알림을 찾을 수 없습니다."),

    // Admin
    ADMIN_ACCESS_DENIED(HttpStatus.FORBIDDEN, "X001", "관리자 권한이 필요합니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
