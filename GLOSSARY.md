# Book Exchange

A service where people list books they own, browse books listed by others, and ask an Owner to swap by offering some of their own books in return.

## People

**User**:
A registered person who can list Books and send ExchangeRequests. Every self-registered account is a User.
_Avoid_: Member, customer, account

**Admin**:
A privileged person who manages all Users and can remove any Book. Never self-registered.
_Avoid_: Superuser, moderator, administrator

**Role**:
The privilege level of a person: either User or Admin.
_Avoid_: Permission, access level

**Owner**:
The User who holds a given Book. A relationship to a Book, not a separate kind of person.
_Avoid_: Seller, lender, holder

**Requester**:
The User who sends an ExchangeRequest. A relationship to an ExchangeRequest, not a separate kind of person.
_Avoid_: Sender, buyer, borrower

**Profile**:
The page where a User sees and changes their own name, email and avatar, and sees how many Books they own and which ExchangeRequests they have received.
_Avoid_: Account, Settings

## Books

**Book**:
A single physical book listed by its Owner, identified by a name, an author and a photo.
_Avoid_: Item, listing, title

**Requested Book**:
The Book a Requester wants to receive in an ExchangeRequest.
_Avoid_: Target book, wanted book

**Offered Book**:
A Book from the Requester's own collection that the Requester proposes to give in return.
_Avoid_: Swap book, exchange list, trade-in

## Exchanging

**ExchangeRequest**:
A recorded proposal from a Requester to the Owner of a Requested Book, offering one or more Offered Books in return. A Requester can never request their own Book.
_Avoid_: Trade, swap, offer, order

**Exchange Notification**:
The message the Owner receives about an ExchangeRequest, naming the Requester and listing the Offered Books.
_Avoid_: Exchange email, alert

**Password Reset Link**:
A one-time link with a limited lifetime that a User receives to set a new password after forgetting the old one.
_Avoid_: Recovery link, Reset token

## Relationships

- A **User** owns zero or more **Books**; each **Book** has exactly one **Owner**.
- A **Requester** sends zero or more **ExchangeRequests**; each **ExchangeRequest** has exactly one **Requester**.
- An **ExchangeRequest** targets exactly one **Requested Book** and contains one or more **Offered Books**.
- The **Owner** of the **Requested Book** is the recipient of the **ExchangeRequest**.
- Every **Offered Book** belongs to the **Requester**; none belongs to the recipient.
- The **Requester** and the **Owner** of an **ExchangeRequest** are always different **Users**.
- Removing a **User** removes their **Books** and every **ExchangeRequest** they sent or received.
- Setting a new password through a **Password Reset Link** ends all of that **User**'s earlier sessions.
- An **Admin** is a **User** with the Admin **Role**; an Admin can also own Books and send ExchangeRequests.

## Naming in code

| Domain term           | Code name                           |
| --------------------- | ----------------------------------- |
| User / Admin          | `User`, `Role.USER`, `Role.ADMIN`   |
| Book                  | `Book` (`ownerId`)                  |
| Requester             | `requester` (`requesterId`)         |
| Requested Book        | `requestedBook` (`requestedBookId`) |
| Offered Book          | `offeredBooks`                      |
| ExchangeRequest       | `ExchangeRequest`                   |
| Exchange Notification | `ExchangeNotification`              |
| Profile               | `Profile`, `/profile`, `avatarUrl`  |
| Password Reset Link   | `PasswordResetLink`                 |
